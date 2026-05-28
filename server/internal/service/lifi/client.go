package lifi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

const baseURL = "https://li.quest/v1"

// Client implements usecase.LifiService.
type Client struct {
	httpClient *http.Client
}

// New creates a LI.FI API client.
func New() *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) get(ctx context.Context, path string, query url.Values, out interface{}) error {
	u := baseURL + path
	if len(query) > 0 {
		u += "?" + query.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return fmt.Errorf("lifi: build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("lifi: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return fmt.Errorf("lifi: read body: %w", err)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("lifi: status %d: %s", resp.StatusCode, body)
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("lifi: decode: %w", err)
	}
	return nil
}

// GetChains returns all EVM chains supported by LI.FI.
func (c *Client) GetChains(ctx context.Context) ([]domain.LifiChain, error) {
	var resp struct {
		Chains []domain.LifiChain `json:"chains"`
	}
	if err := c.get(ctx, "/chains", url.Values{"chainTypes": {"EVM"}}, &resp); err != nil {
		return nil, err
	}
	return resp.Chains, nil
}

// GetTokens returns tokens available for swapping on the given chain.
func (c *Client) GetTokens(ctx context.Context, chainID int) ([]domain.LifiToken, error) {
	q := url.Values{"chains": {strconv.Itoa(chainID)}}
	var resp struct {
		Tokens map[string][]domain.LifiToken `json:"tokens"`
	}
	if err := c.get(ctx, "/tokens", q, &resp); err != nil {
		return nil, err
	}
	return resp.Tokens[strconv.Itoa(chainID)], nil
}

// GetQuote fetches a swap/bridge quote from LI.FI.
func (c *Client) GetQuote(ctx context.Context, params domain.LifiQuoteParams) (*domain.LifiQuote, error) {
	slippage := params.Slippage
	if slippage <= 0 {
		slippage = 0.005
	}
	q := url.Values{
		"fromChain":   {strconv.Itoa(params.FromChain)},
		"toChain":     {strconv.Itoa(params.ToChain)},
		"fromToken":   {params.FromToken},
		"toToken":     {params.ToToken},
		"fromAmount":  {params.FromAmount},
		"fromAddress": {params.FromAddress},
		"slippage":    {strconv.FormatFloat(slippage, 'f', 4, 64)},
	}
	var quote domain.LifiQuote
	if err := c.get(ctx, "/quote", q, &quote); err != nil {
		return nil, err
	}
	return &quote, nil
}
