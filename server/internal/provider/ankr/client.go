// Package ankr implements provider.BlockchainProvider using the Ankr Advanced
// Multichain API (https://www.ankr.com/rpc/advanced-api/). It supports native/
// token balances, NFTs, and transactions; advanced features return ErrNotSupported.
package ankr

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
)

const publicEndpoint = "https://rpc.ankr.com/multichain"

// Client is an Ankr Advanced Multichain API client.
type Client struct {
	endpoint   string
	httpClient *http.Client
}

// New creates an Ankr client. apiKey is optional — pass an empty string to use
// the public (heavily rate-limited) endpoint, or supply a free Ankr API key
// from https://www.ankr.com/rpc/ for higher limits.
func New(apiKey string) *Client {
	ep := publicEndpoint
	if apiKey != "" {
		ep = publicEndpoint + "/" + apiKey
	}
	return &Client{
		endpoint:   ep,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Name() string { return "ankr" }

type rpcRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
	ID      int         `json:"id"`
}

func (c *Client) call(ctx context.Context, method string, params interface{}, out interface{}) error {
	payload, err := json.Marshal(rpcRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	})
	if err != nil {
		return fmt.Errorf("ankr: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("ankr: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("ankr: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return fmt.Errorf("ankr: read body: %w", err)
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("ankr: %w", provider.ErrRateLimit)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("ankr: status %d: %s", resp.StatusCode, body)
	}

	// Detect JSON-RPC level rate-limit error (-32005)
	var rpcErr struct {
		Error *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(body, &rpcErr); err == nil && rpcErr.Error != nil {
		if rpcErr.Error.Code == -32005 {
			return fmt.Errorf("ankr: %w", provider.ErrRateLimit)
		}
		return fmt.Errorf("ankr: rpc error %d: %s", rpcErr.Error.Code, rpcErr.Error.Message)
	}

	return json.Unmarshal(body, out)
}

// ── Asset Holdings ────────────────────────────────────────────────────────────

func (c *Client) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	var resp struct {
		Result struct {
			Assets []struct {
				TokenType        string `json:"tokenType"`
				BalanceRawInteger string `json:"balanceRawInteger"`
			} `json:"assets"`
		} `json:"result"`
	}
	if err := c.call(ctx, "ankr_getAccountBalance", map[string]interface{}{
		"blockchain":    chain,
		"walletAddress": address,
		"pageSize":      50,
	}, &resp); err != nil {
		return nil, err
	}
	for _, asset := range resp.Result.Assets {
		if asset.TokenType == "NATIVE" {
			return &domain.NativeBalance{Balance: asset.BalanceRawInteger}, nil
		}
	}
	return &domain.NativeBalance{Balance: "0"}, nil
}

func (c *Client) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	var resp struct {
		Result struct {
			Assets []struct {
				TokenType        string  `json:"tokenType"`
				ContractAddress  string  `json:"contractAddress"`
				TokenName        string  `json:"tokenName"`
				TokenSymbol      string  `json:"tokenSymbol"`
				TokenDecimals    int     `json:"tokenDecimals"`
				Balance          string  `json:"balance"`
				BalanceRawInteger string `json:"balanceRawInteger"`
				BalanceUsd       string  `json:"balanceUsd"`
				TokenPrice       string  `json:"tokenPrice"`
				Thumbnail        string  `json:"thumbnail"`
			} `json:"assets"`
		} `json:"result"`
	}
	if err := c.call(ctx, "ankr_getAccountBalance", map[string]interface{}{
		"blockchain":    chain,
		"walletAddress": address,
		"pageSize":      100,
	}, &resp); err != nil {
		return nil, err
	}
	var out []domain.Token
	for _, asset := range resp.Result.Assets {
		if asset.TokenType == "NATIVE" {
			continue
		}
		out = append(out, domain.Token{
			TokenAddress:     asset.ContractAddress,
			Symbol:           asset.TokenSymbol,
			Name:             asset.TokenName,
			Decimals:         strconv.Itoa(asset.TokenDecimals),
			Balance:          asset.BalanceRawInteger,
			BalanceFormatted: asset.Balance,
			USDPrice:         asset.TokenPrice,
			USDValue:         asset.BalanceUsd,
			Logo:             asset.Thumbnail,
			PossibleSpam:     false,
		})
	}
	return out, nil
}

func (c *Client) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	var resp struct {
		Result struct {
			Assets []struct {
				Blockchain      string `json:"blockchain"`
				Name            string `json:"name"`
				TokenID         string `json:"tokenId"`
				ContractAddress string `json:"contractAddress"`
				ContractType    string `json:"contractType"`
				Symbol          string `json:"symbol"`
				ImageUrl        string `json:"imageUrl"`
			} `json:"assets"`
		} `json:"result"`
	}
	if err := c.call(ctx, "ankr_getNFTsByOwner", map[string]interface{}{
		"blockchain":    chain,
		"walletAddress": address,
		"pageSize":      100,
	}, &resp); err != nil {
		return nil, err
	}
	out := make([]domain.NFT, len(resp.Result.Assets))
	for i, a := range resp.Result.Assets {
		out[i] = domain.NFT{
			TokenAddress: a.ContractAddress,
			TokenID:      a.TokenID,
			Name:         a.Name,
			Symbol:       a.Symbol,
			TokenURI:     a.ImageUrl,
			Metadata:     "",
			Amount:       "1",
			ContractType: a.ContractType,
		}
	}
	return out, nil
}

// ── Transaction History ───────────────────────────────────────────────────────

// GetWalletHistory is not supported — decoded activity summaries are a
// Moralis-specific feature.
func (c *Client) GetWalletHistory(_ context.Context, _, _ string) ([]domain.HistoryEntry, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetTransactions(ctx context.Context, address, chain string) ([]domain.Transaction, error) {
	var resp struct {
		Result struct {
			Transactions []struct {
				Hash      string `json:"hash"`
				From      string `json:"from"`
				To        string `json:"to"`
				Value     string `json:"value"`
				Gas       string `json:"gas"`
				GasPrice  string `json:"gasPrice"`
				BlockNumber string `json:"blockNumber"`
				Timestamp string `json:"timestamp"`
			} `json:"transactions"`
		} `json:"result"`
	}
	if err := c.call(ctx, "ankr_getTransactionsByAddress", map[string]interface{}{
		"address":    address,
		"blockchain": chain,
		"pageSize":   100,
	}, &resp); err != nil {
		return nil, err
	}
	out := make([]domain.Transaction, len(resp.Result.Transactions))
	for i, tx := range resp.Result.Transactions {
		out[i] = domain.Transaction{
			Hash:           tx.Hash,
			FromAddress:    tx.From,
			ToAddress:      tx.To,
			Value:          tx.Value,
			BlockNumber:    tx.BlockNumber,
			BlockTimestamp: tx.Timestamp,
			Gas:            tx.Gas,
			GasPrice:       tx.GasPrice,
			TransactionFee: "",
		}
	}
	return out, nil
}

// ── Unsupported methods ───────────────────────────────────────────────────────

func (c *Client) GetDeFiPositions(_ context.Context, _, _ string) ([]domain.DeFiPosition, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetNetWorth(_ context.Context, _ string, _ []string) (*domain.NetWorth, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetPnLSummary(_ context.Context, _, _ string, _ int) (*domain.PnLSummary, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetPnLBreakdown(_ context.Context, _, _ string, _ int) ([]domain.TokenPnL, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) ResolveENS(_ context.Context, _ string) (*domain.ENSInfo, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetApprovals(_ context.Context, _, _ string) ([]domain.Approval, error) {
	return nil, provider.ErrNotSupported
}
