package moralis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
)

const defaultBaseURL = "https://deep-index.moralis.io/api/v2.2"

// Client implements provider.BlockchainProvider.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// New creates a Moralis API client.
func New(apiKey string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: defaultBaseURL,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) Name() string { return "moralis" }

// ── helpers ──────────────────────────────────────────────────────────────────

func (c *Client) get(ctx context.Context, path string, query url.Values, out interface{}) error {
	if c.apiKey == "" {
		return provider.ErrMissingAPIKey
	}

	u := c.baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return fmt.Errorf("moralis: build request: %w", err)
	}
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return fmt.Errorf("moralis: %w", provider.ErrTimeout)
		}
		return fmt.Errorf("moralis: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20)) // 4 MB cap
	if err != nil {
		return fmt.Errorf("moralis: read body: %w", err)
	}

	switch {
	case resp.StatusCode == http.StatusTooManyRequests:
		return fmt.Errorf("moralis: %w", provider.ErrRateLimit)
	case resp.StatusCode == http.StatusUnauthorized, resp.StatusCode == http.StatusForbidden:
		return fmt.Errorf("moralis: %w", provider.ErrAuthFailed)
	case resp.StatusCode >= 500:
		return fmt.Errorf("moralis: %w (status %d)", provider.ErrUnavailable, resp.StatusCode)
	case resp.StatusCode >= 400:
		return fmt.Errorf("moralis: status %d: %s", resp.StatusCode, truncate(body, 200))
	}

	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("moralis: %w: %v", provider.ErrInvalidResponse, err)
	}
	return nil
}

func truncate(b []byte, n int) string {
	if len(b) <= n {
		return string(b)
	}
	return string(b[:n]) + "…"
}

// ── Asset Holdings ────────────────────────────────────────────────────────────

func (c *Client) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	var raw struct {
		Balance string `json:"balance"`
	}
	if err := c.get(ctx, "/"+address+"/balance", url.Values{"chain": {chain}}, &raw); err != nil {
		return nil, err
	}
	return &domain.NativeBalance{Balance: raw.Balance}, nil
}

func (c *Client) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	var raw struct {
		Result []struct {
			TokenAddress     string `json:"token_address"`
			Symbol           string `json:"symbol"`
			Name             string `json:"name"`
			Decimals         string `json:"decimals"`
			Balance          string `json:"balance"`
			BalanceFormatted string `json:"balance_formatted"`
			UsdPrice         string `json:"usd_price"`
			UsdValue         string `json:"usd_value"`
			Logo             string `json:"logo"`
			PossibleSpam     bool   `json:"possible_spam"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}, "exclude_spam": {"true"}}
	if err := c.get(ctx, "/wallets/"+address+"/tokens", q, &raw); err != nil {
		return nil, err
	}
	out := make([]domain.Token, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.Token{
			TokenAddress:     r.TokenAddress,
			Symbol:           r.Symbol,
			Name:             r.Name,
			Decimals:         r.Decimals,
			Balance:          r.Balance,
			BalanceFormatted: r.BalanceFormatted,
			USDPrice:         r.UsdPrice,
			USDValue:         r.UsdValue,
			Logo:             r.Logo,
			PossibleSpam:     r.PossibleSpam,
		}
	}
	return out, nil
}

func (c *Client) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	var raw struct {
		Result []struct {
			TokenAddress string `json:"token_address"`
			TokenID      string `json:"token_id"`
			Name         string `json:"name"`
			Symbol       string `json:"symbol"`
			TokenURI     string `json:"token_uri"`
			Metadata     string `json:"metadata"`
			Amount       string `json:"amount"`
			ContractType string `json:"contract_type"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}, "limit": {"100"}}
	if err := c.get(ctx, "/"+address+"/nft", q, &raw); err != nil {
		return nil, err
	}
	out := make([]domain.NFT, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.NFT{
			TokenAddress: r.TokenAddress,
			TokenID:      r.TokenID,
			Name:         r.Name,
			Symbol:       r.Symbol,
			TokenURI:     r.TokenURI,
			Metadata:     r.Metadata,
			Amount:       r.Amount,
			ContractType: r.ContractType,
		}
	}
	return out, nil
}

// ── Transaction History ───────────────────────────────────────────────────────

func (c *Client) GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error) {
	var raw struct {
		Result []struct {
			Hash           string `json:"hash"`
			Category       string `json:"category"`
			Summary        string `json:"summary"`
			BlockTimestamp string `json:"block_timestamp"`
			BlockNumber    string `json:"block_number"`
			TransactionFee string `json:"transaction_fee"`
			FromAddress    string `json:"from_address"`
			ToAddress      string `json:"to_address"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}, "limit": {"100"}}
	if err := c.get(ctx, "/wallets/"+address+"/history", q, &raw); err != nil {
		return nil, err
	}
	out := make([]domain.HistoryEntry, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.HistoryEntry{
			Hash:           r.Hash,
			Category:       r.Category,
			Summary:        r.Summary,
			BlockTimestamp: r.BlockTimestamp,
			BlockNumber:    r.BlockNumber,
			TransactionFee: r.TransactionFee,
			FromAddress:    r.FromAddress,
			ToAddress:      r.ToAddress,
		}
	}
	return out, nil
}

// GetTransactions returns one page of transactions.
//
// Moralis paginates this endpoint with an opaque cursor, not a page number,
// so PageInfo.Page in the response is always reported as 0 — a caller-chosen
// page.Page greater than 0 cannot be honored through this adapter (the
// interface has no way to carry Moralis's cursor back to a later call).
// PageInfo.HasMore still reflects whether Moralis returned a next cursor, so
// list truncation is never silent even though deep paging isn't supported.
func (c *Client) GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error) {
	page = page.Normalize(25, 100)
	var raw struct {
		Cursor string `json:"cursor"`
		Result []struct {
			Hash           string `json:"hash"`
			FromAddress    string `json:"from_address"`
			ToAddress      string `json:"to_address"`
			Value          string `json:"value"`
			BlockNumber    string `json:"block_number"`
			BlockTimestamp string `json:"block_timestamp"`
			Gas            string `json:"gas"`
			GasPrice       string `json:"gas_price"`
			TransactionFee string `json:"transaction_fee"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}, "limit": {strconv.Itoa(page.PageSize)}}
	if err := c.get(ctx, "/"+address, q, &raw); err != nil {
		return domain.TransactionPage{}, err
	}
	out := make([]domain.Transaction, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.Transaction{
			Hash:           r.Hash,
			FromAddress:    r.FromAddress,
			ToAddress:      r.ToAddress,
			Value:          r.Value,
			BlockNumber:    r.BlockNumber,
			BlockTimestamp: r.BlockTimestamp,
			Gas:            r.Gas,
			GasPrice:       r.GasPrice,
			TransactionFee: r.TransactionFee,
		}
	}
	return domain.TransactionPage{
		Items: out,
		Page:  domain.PageInfo{Page: 0, PageSize: page.PageSize, HasMore: raw.Cursor != ""},
	}, nil
}

// GetTokenTransfers returns one page of ERC-20 transfer events. See
// GetTransactions for the same cursor-vs-page-number caveat.
func (c *Client) GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error) {
	page = page.Normalize(25, 100)
	var raw struct {
		Cursor string `json:"cursor"`
		Result []struct {
			TransactionHash string `json:"transaction_hash"`
			Address         string `json:"address"`
			FromAddress     string `json:"from_address"`
			ToAddress       string `json:"to_address"`
			Value           string `json:"value"`
			BlockTimestamp  string `json:"block_timestamp"`
			BlockNumber     string `json:"block_number"`
			TokenName       string `json:"token_name"`
			TokenSymbol     string `json:"token_symbol"`
			TokenDecimals   string `json:"token_decimals"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}, "limit": {strconv.Itoa(page.PageSize)}}
	if err := c.get(ctx, "/"+address+"/erc20/transfers", q, &raw); err != nil {
		return domain.TokenTransferPage{}, err
	}
	out := make([]domain.TokenTransfer, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.TokenTransfer{
			TxHash:          r.TransactionHash,
			FromAddress:     r.FromAddress,
			ToAddress:       r.ToAddress,
			ContractAddress: r.Address,
			TokenName:       r.TokenName,
			TokenSymbol:     r.TokenSymbol,
			Decimals:        r.TokenDecimals,
			Value:           r.Value,
			BlockTimestamp:  r.BlockTimestamp,
			BlockNumber:     r.BlockNumber,
		}
	}
	return domain.TokenTransferPage{
		Items: out,
		Page:  domain.PageInfo{Page: 0, PageSize: page.PageSize, HasMore: raw.Cursor != ""},
	}, nil
}

// ── DeFi Positions ────────────────────────────────────────────────────────────

func (c *Client) GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error) {
	var raw struct {
		Result []struct {
			ProtocolID   string                 `json:"protocol_id"`
			ProtocolName string                 `json:"protocol_name"`
			ProtocolLogo string                 `json:"protocol_logo"`
			Chain        string                 `json:"chain"`
			Position     map[string]interface{} `json:"position"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}}
	if err := c.get(ctx, "/wallets/"+address+"/defi/positions", q, &raw); err != nil {
		return nil, err
	}
	out := make([]domain.DeFiPosition, len(raw.Result))
	for i, r := range raw.Result {
		out[i] = domain.DeFiPosition{
			ProtocolID:   r.ProtocolID,
			ProtocolName: r.ProtocolName,
			ProtocolLogo: r.ProtocolLogo,
			Chain:        r.Chain,
			Position:     r.Position,
		}
	}
	return out, nil
}

// ── Financial Metrics ─────────────────────────────────────────────────────────

func (c *Client) GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error) {
	q := url.Values{"exclude_spam": {"true"}, "exclude_small_balances": {"true"}}
	for _, ch := range chains {
		q.Add("chains[]", ch)
	}
	var raw struct {
		TotalNetworthUSD string `json:"total_networth_usd"`
		Chains           []struct {
			Chain       string `json:"chain"`
			NetworthUSD string `json:"networth_usd"`
		} `json:"chains"`
	}
	if err := c.get(ctx, "/wallets/"+address+"/net-worth", q, &raw); err != nil {
		return nil, err
	}
	out := &domain.NetWorth{TotalNetworthUSD: raw.TotalNetworthUSD}
	for _, c := range raw.Chains {
		out.Chains = append(out.Chains, domain.ChainWorth{Chain: c.Chain, NetworthUSD: c.NetworthUSD})
	}
	return out, nil
}

func (c *Client) GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error) {
	q := url.Values{"chain": {chain}}
	if days > 0 {
		q.Set("days", strconv.Itoa(days))
	}
	var raw domain.PnLSummary
	if err := c.get(ctx, "/wallets/"+address+"/profitability/summary", q, &raw); err != nil {
		return nil, err
	}
	return &raw, nil
}

func (c *Client) GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error) {
	q := url.Values{"chain": {chain}}
	if days > 0 {
		q.Set("days", strconv.Itoa(days))
	}
	var raw struct {
		Result []domain.TokenPnL `json:"result"`
	}
	if err := c.get(ctx, "/wallets/"+address+"/profitability", q, &raw); err != nil {
		return nil, err
	}
	return raw.Result, nil
}

// ── Identity ──────────────────────────────────────────────────────────────────

func (c *Client) ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error) {
	var raw struct {
		Name string `json:"name"`
	}
	if err := c.get(ctx, "/resolve/"+address+"/reverse", nil, &raw); err != nil {
		return nil, err
	}
	return &domain.ENSInfo{Name: raw.Name, Address: address}, nil
}

// ── Approvals ─────────────────────────────────────────────────────────────────

func (c *Client) GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error) {
	var raw struct {
		Result []struct {
			Token struct {
				ContractAddress string `json:"contract_address"`
				Symbol          string `json:"symbol"`
				Name            string `json:"name"`
			} `json:"token"`
			Spender struct {
				Address string `json:"address"`
				Label   string `json:"label"`
			} `json:"spender"`
			Value          string `json:"value"`
			ValueFormatted string `json:"value_formatted"`
			BlockTimestamp string `json:"block_timestamp"`
		} `json:"result"`
	}
	q := url.Values{"chain": {chain}}
	if err := c.get(ctx, "/wallets/"+address+"/approvals", q, &raw); err != nil {
		return nil, err
	}
	out := make([]domain.Approval, len(raw.Result))
	for i, r := range raw.Result {
		label := r.Spender.Label
		// Sanitise label – Moralis may return HTML; strip any tags defensively
		label = strings.Map(func(r rune) rune {
			if r == '<' || r == '>' {
				return -1
			}
			return r
		}, label)
		out[i] = domain.Approval{
			TokenAddress:   r.Token.ContractAddress,
			TokenSymbol:    r.Token.Symbol,
			TokenName:      r.Token.Name,
			Spender:        r.Spender.Address,
			SpenderLabel:   label,
			Value:          r.Value,
			ValueFormatted: r.ValueFormatted,
			BlockTimestamp: r.BlockTimestamp,
		}
	}
	return out, nil
}
