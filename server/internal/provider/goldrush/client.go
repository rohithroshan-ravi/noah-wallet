// Package goldrush implements provider.BlockchainProvider using the Covalent
// GoldRush API (https://goldrush.dev). It supports native/token balances,
// NFTs, paginated transactions, and ERC-20 token transfers; advanced
// Moralis-specific features return ErrNotSupported so the failover layer can
// try another provider.
package goldrush

import (
	"context"
	"encoding/base64"
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

const defaultBaseURL = "https://api.covalenthq.com/v1"

// fixedPageSize is the page size GoldRush's transactions_v3 endpoint always
// uses — it does not accept a page-size query param, so a caller-requested
// domain.Pagination.PageSize cannot be honored exactly. See GetTransactions.
const fixedPageSize = 100

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

// Client is a Covalent GoldRush API client. Safe for concurrent use; it holds
// a single long-lived *http.Client so outbound TCP/TLS connections are reused
// across requests instead of being redialed each call.
type Client struct {
	apiKey     string
	authHeader string
	baseURL    string
	httpClient *http.Client
}

// New creates a Covalent (GoldRush) client. apiKey is your GoldRush API key
// (https://goldrush.dev/platform/auth/register). An empty apiKey is
// accepted — the client is still constructed so it can sit in a Failover
// chain, but every call fails fast with provider.ErrMissingAPIKey instead of
// making a doomed HTTP request.
func New(apiKey string) *Client {
	encoded := base64.StdEncoding.EncodeToString([]byte(apiKey + ":"))
	return &Client{
		apiKey:     apiKey,
		authHeader: "Basic " + encoded,
		baseURL:    defaultBaseURL,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Name() string { return "goldrush" }

func (c *Client) chain(moralisChain string) (string, error) {
	if name, ok := chainNames[moralisChain]; ok {
		return name, nil
	}
	return "", fmt.Errorf("goldrush: %w: unknown chain %q", provider.ErrNotSupported, moralisChain)
}

// get issues an authenticated GET and decodes the JSON body into out.
// It classifies every failure into one of the provider.Err* sentinels so
// callers (and the Failover layer) can react without knowing GoldRush's
// specific status-code/error-body conventions. The API key is never included
// in any returned error or logged anywhere in this method.
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
		return fmt.Errorf("goldrush: build request: %w", err)
	}
	req.Header.Set("Authorization", c.authHeader)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return fmt.Errorf("goldrush: %w", provider.ErrTimeout)
		}
		return fmt.Errorf("goldrush: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20)) // 4 MB cap
	if err != nil {
		return fmt.Errorf("goldrush: read body: %w", err)
	}

	switch {
	case resp.StatusCode == http.StatusTooManyRequests:
		return fmt.Errorf("goldrush: %w", provider.ErrRateLimit)
	case resp.StatusCode == http.StatusUnauthorized, resp.StatusCode == http.StatusForbidden:
		return fmt.Errorf("goldrush: %w", provider.ErrAuthFailed)
	case resp.StatusCode >= 500:
		return fmt.Errorf("goldrush: %w (status %d)", provider.ErrUnavailable, resp.StatusCode)
	case resp.StatusCode >= 400:
		return fmt.Errorf("goldrush: status %d: %s", resp.StatusCode, truncate(body, 200))
	}

	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("goldrush: %w: %v", provider.ErrInvalidResponse, err)
	}
	return nil
}

// truncate caps err body text so a chatty upstream error can't blow up log
// lines or downstream error strings.
func truncate(b []byte, n int) string {
	if len(b) <= n {
		return string(b)
	}
	return string(b[:n]) + "…"
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

// txV3LogEventParam is one decoded ABI parameter of a log event.
type txV3LogEventParam struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Value string `json:"value"`
}

// txV3LogEvent is one decoded log entry emitted by a transaction.
type txV3LogEvent struct {
	TxHash                     string   `json:"tx_hash"`
	BlockSignedAt              string   `json:"block_signed_at"`
	BlockHeight                int64    `json:"block_height"`
	SenderAddress              string   `json:"sender_address"`
	SenderName                 string   `json:"sender_name"`
	SenderContractTickerSymbol string   `json:"sender_contract_ticker_symbol"`
	SenderContractDecimals     int      `json:"sender_contract_decimals"`
	SupportsErc                []string `json:"supports_erc"`
	Decoded                    struct {
		Name      string              `json:"name"`
		Signature string              `json:"signature"`
		Params    []txV3LogEventParam `json:"params"`
	} `json:"decoded"`
}

// txV3Item is one transaction as returned by transactions_v3.
type txV3Item struct {
	TxHash        string         `json:"tx_hash"`
	FromAddress   string         `json:"from_address"`
	ToAddress     string         `json:"to_address"`
	Value         string         `json:"value"`
	BlockHeight   int64          `json:"block_height"`
	BlockSignedAt string         `json:"block_signed_at"`
	GasOffered    int64          `json:"gas_offered"`
	GasPrice      int64          `json:"gas_price"`
	FeesPaid      string         `json:"fees_paid"`
	LogEvents     []txV3LogEvent `json:"log_events"`
}

// txV3Data is the "data" payload of a transactions_v3 page response.
type txV3Data struct {
	CurrentPage int `json:"current_page"`
	Links       struct {
		Prev string `json:"prev"`
		Next string `json:"next"`
	} `json:"links"`
	Items []txV3Item `json:"items"`
}

// fetchTransactionsPage fetches one page of transactions_v3.
//
// GoldRush paginates this endpoint by page-number path segment, not a
// page-size query param — the page size is fixed at 100 server-side, so
// page.PageSize (already normalized by the caller) only controls how many of
// the fetched items we hand back, not how many GoldRush returns to us.
func (c *Client) fetchTransactionsPage(ctx context.Context, cChain, address string, pageNum int, includeLogs bool) (*txV3Data, error) {
	q := url.Values{}
	if !includeLogs {
		q.Set("no-logs", "true")
	}
	path := fmt.Sprintf("/%s/address/%s/transactions_v3/page/%d/", cChain, address, pageNum)
	var resp struct {
		Data txV3Data `json:"data"`
	}
	if err := c.get(ctx, path, q, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return domain.TransactionPage{}, err
	}
	page = page.Normalize(25, fixedPageSize)

	data, err := c.fetchTransactionsPage(ctx, cChain, address, page.Page, false)
	if err != nil {
		return domain.TransactionPage{}, err
	}

	out := make([]domain.Transaction, len(data.Items))
	for i, tx := range data.Items {
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
	return domain.TransactionPage{
		Items: out,
		Page:  domain.PageInfo{Page: page.Page, PageSize: fixedPageSize, HasMore: data.Links.Next != ""},
	}, nil
}

// GetTokenTransfers extracts decoded ERC-20 Transfer log events from
// transactions_v3 (fetched with logs included). GoldRush's dedicated
// transfers_v2 endpoint requires a single contract-address and so cannot list
// "all ERC-20 transfers for this wallet" in one call; deriving transfers from
// already-decoded transaction logs covers that case in one request instead.
func (c *Client) GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error) {
	cChain, err := c.chain(chain)
	if err != nil {
		return domain.TokenTransferPage{}, err
	}
	page = page.Normalize(25, fixedPageSize)

	data, err := c.fetchTransactionsPage(ctx, cChain, address, page.Page, true)
	if err != nil {
		return domain.TokenTransferPage{}, err
	}

	var out []domain.TokenTransfer
	for _, tx := range data.Items {
		for _, lg := range tx.LogEvents {
			if !isERC20Transfer(lg) {
				continue
			}
			from, to, value := decodeTransferParams(lg.Decoded.Params)
			if from == "" && to == "" {
				continue // couldn't decode — skip rather than emit a garbage row
			}
			out = append(out, domain.TokenTransfer{
				TxHash:          tx.TxHash,
				FromAddress:     from,
				ToAddress:       to,
				ContractAddress: lg.SenderAddress,
				TokenName:       lg.SenderName,
				TokenSymbol:     lg.SenderContractTickerSymbol,
				Decimals:        strconv.Itoa(lg.SenderContractDecimals),
				Value:           value,
				BlockTimestamp:  tx.BlockSignedAt,
				BlockNumber:     strconv.FormatInt(tx.BlockHeight, 10),
			})
		}
	}
	return domain.TokenTransferPage{
		Items: out,
		Page:  domain.PageInfo{Page: page.Page, PageSize: fixedPageSize, HasMore: data.Links.Next != ""},
	}, nil
}

// isERC20Transfer reports whether a decoded log event is an ERC-20 Transfer.
// ERC-721's Transfer event shares the same name/signature as ERC-20's, so
// supports_erc is checked to exclude NFT transfers.
func isERC20Transfer(lg txV3LogEvent) bool {
	if lg.Decoded.Name != "Transfer" {
		return false
	}
	for _, erc := range lg.SupportsErc {
		if strings.EqualFold(erc, "erc20") {
			return true
		}
	}
	return false
}

func decodeTransferParams(params []txV3LogEventParam) (from, to, value string) {
	for _, p := range params {
		switch strings.ToLower(p.Name) {
		case "from":
			from = p.Value
		case "to":
			to = p.Value
		case "value":
			value = p.Value
		}
	}
	return from, to, value
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
