// Package covalent implements provider.BlockchainProvider using the Covalent
// GoldRush API (https://goldrush.dev). It supports native/token balances, NFTs,
// and transactions; advanced Moralis-specific features return ErrNotSupported so
// the failover layer can try another provider.
package covalent

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
)

const baseURL = "https://api.covalenthq.com/v1"

// chainNames maps Moralis-style chain IDs to Covalent chain names.
var chainNames = map[string]string{
	"eth":       "eth-mainnet",
	"polygon":   "matic-mainnet",
	"bsc":       "bsc-mainnet",
	"avalanche": "avalanche-mainnet",
	"arbitrum":  "arbitrum-mainnet",
	"optimism":  "optimism-mainnet",
	"base":      "base-mainnet",
	"fantom":    "fantom-mainnet",
	"linea":     "linea-mainnet",
	"cronos":    "cronos-mainnet",
}

// Client is a Covalent GoldRush API client.
type Client struct {
	apiKey     string
	authHeader string
	httpClient *http.Client
}

// New creates a Covalent client. apiKey is your GoldRush API key
// (https://goldrush.dev/platform/auth/register).
func New(apiKey string) *Client {
	encoded := base64.StdEncoding.EncodeToString([]byte(apiKey + ":"))
	return &Client{
		apiKey:     apiKey,
		authHeader: "Basic " + encoded,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Name() string { return "covalent" }

func (c *Client) chain(moralisChain string) (string, error) {
	if name, ok := chainNames[moralisChain]; ok {
		return name, nil
	}
	return "", fmt.Errorf("%w: unknown chain %q", provider.ErrNotSupported, moralisChain)
}

func (c *Client) get(ctx context.Context, path string, query url.Values, out interface{}) error {
	u := baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return fmt.Errorf("covalent: build request: %w", err)
	}
	req.Header.Set("Authorization", c.authHeader)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("covalent: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return fmt.Errorf("covalent: read body: %w", err)
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("covalent: %w", provider.ErrRateLimit)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("covalent: status %d: %s", resp.StatusCode, body)
	}
	return json.Unmarshal(body, out)
}

// ── Asset Holdings ────────────────────────────────────────────────────────────

func (c *Client) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Data struct {
			Items []struct {
				NativeToken bool   `json:"native_token"`
				Balance     string `json:"balance"`
			} `json:"items"`
		} `json:"data"`
	}
	if err := c.get(ctx, fmt.Sprintf("/%s/address/%s/balances_v2/", cChain, address), nil, &resp); err != nil {
		return nil, err
	}
	for _, item := range resp.Data.Items {
		if item.NativeToken {
			return &domain.NativeBalance{Balance: item.Balance}, nil
		}
	}
	return &domain.NativeBalance{Balance: "0"}, nil
}

func (c *Client) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Data struct {
			Items []struct {
				ContractAddress string  `json:"contract_address"`
				ContractName    string  `json:"contract_name"`
				TickerSymbol    string  `json:"contract_ticker_symbol"`
				Decimals        int     `json:"contract_decimals"`
				Balance         string  `json:"balance"`
				QuoteRate       float64 `json:"quote_rate"`
				Quote           float64 `json:"quote"`
				LogoURL         string  `json:"logo_url"`
				NativeToken     bool    `json:"native_token"`
				IsSpam          bool    `json:"is_spam"`
			} `json:"items"`
		} `json:"data"`
	}
	q := url.Values{"nft": {"false"}, "no-spam": {"true"}}
	if err := c.get(ctx, fmt.Sprintf("/%s/address/%s/balances_v2/", cChain, address), q, &resp); err != nil {
		return nil, err
	}
	var out []domain.Token
	for _, item := range resp.Data.Items {
		if item.NativeToken || item.IsSpam {
			continue
		}
		out = append(out, domain.Token{
			TokenAddress:     item.ContractAddress,
			Symbol:           item.TickerSymbol,
			Name:             item.ContractName,
			Decimals:         strconv.Itoa(item.Decimals),
			Balance:          item.Balance,
			BalanceFormatted: "",
			USDPrice:         strconv.FormatFloat(item.QuoteRate, 'f', 6, 64),
			USDValue:         strconv.FormatFloat(item.Quote, 'f', 6, 64),
			Logo:             item.LogoURL,
			PossibleSpam:     false,
		})
	}
	return out, nil
}

func (c *Client) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Data struct {
			Items []struct {
				ContractAddress string `json:"contract_address"`
				ContractName    string `json:"contract_name"`
				TickerSymbol    string `json:"contract_ticker_symbol"`
				TokenID         string `json:"token_id"`
				TokenURL        string `json:"token_url"`
				ContractType    string `json:"type"`
				NFTData         []struct {
					TokenID  string `json:"token_id"`
					TokenURL string `json:"token_url"`
				} `json:"nft_data"`
			} `json:"items"`
		} `json:"data"`
	}
	if err := c.get(ctx, fmt.Sprintf("/%s/address/%s/balances_nft/", cChain, address), nil, &resp); err != nil {
		return nil, err
	}
	out := make([]domain.NFT, 0, len(resp.Data.Items))
	for _, item := range resp.Data.Items {
		tokenID := item.TokenID
		tokenURL := item.TokenURL
		if len(item.NFTData) > 0 {
			if item.NFTData[0].TokenID != "" {
				tokenID = item.NFTData[0].TokenID
			}
			if item.NFTData[0].TokenURL != "" {
				tokenURL = item.NFTData[0].TokenURL
			}
		}
		out = append(out, domain.NFT{
			TokenAddress: item.ContractAddress,
			TokenID:      tokenID,
			Name:         item.ContractName,
			Symbol:       item.TickerSymbol,
			TokenURI:     tokenURL,
			Metadata:     "",
			Amount:       "1",
			ContractType: item.ContractType,
		})
	}
	return out, nil
}

// ── Transaction History ───────────────────────────────────────────────────────

// GetWalletHistory is not supported by Covalent — decoded summaries/categories
// are a Moralis-specific feature.
func (c *Client) GetWalletHistory(_ context.Context, _, _ string) ([]domain.HistoryEntry, error) {
	return nil, provider.ErrNotSupported
}

func (c *Client) GetTransactions(ctx context.Context, address, chain string) ([]domain.Transaction, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Data struct {
			Items []struct {
				TxHash         string `json:"tx_hash"`
				FromAddress    string `json:"from_address"`
				ToAddress      string `json:"to_address"`
				Value          string `json:"value"`
				BlockHeight    int64  `json:"block_height"`
				BlockSignedAt  string `json:"block_signed_at"`
				GasOffered     int64  `json:"gas_offered"`
				GasPrice       int64  `json:"gas_price"`
				FeesPaid       string `json:"fees_paid"`
			} `json:"items"`
		} `json:"data"`
	}
	q := url.Values{"page-size": {"100"}}
	if err := c.get(ctx, fmt.Sprintf("/%s/address/%s/transactions_v3/", cChain, address), q, &resp); err != nil {
		return nil, err
	}
	out := make([]domain.Transaction, len(resp.Data.Items))
	for i, tx := range resp.Data.Items {
		out[i] = domain.Transaction{
			Hash:           tx.TxHash,
			FromAddress:    tx.FromAddress,
			ToAddress:      tx.ToAddress,
			Value:          tx.Value,
			BlockNumber:    strconv.FormatInt(tx.BlockHeight, 10),
			BlockTimestamp: tx.BlockSignedAt,
			Gas:            strconv.FormatInt(tx.GasOffered, 10),
			GasPrice:       strconv.FormatInt(tx.GasPrice, 10),
			TransactionFee: tx.FeesPaid,
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
