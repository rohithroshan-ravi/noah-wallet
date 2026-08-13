package goldrush

import (
	"context"
	"encoding/base64"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
)

// newTestClient builds a Client pointed at srv instead of the real GoldRush
// API. Being in the same package, the test can set unexported fields
// directly rather than needing an exported test-only constructor.
func newTestClient(srv *httptest.Server, apiKey string) *Client {
	encoded := base64.StdEncoding.EncodeToString([]byte(apiKey + ":"))
	return &Client{
		apiKey:     apiKey,
		authHeader: "Basic " + encoded,
		baseURL:    srv.URL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

func TestGetNativeBalance_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got == "" {
			t.Errorf("expected Authorization header to be set")
		}
		w.Write([]byte(`{"data":{"items":[
			{"native_token":false,"balance":"999"},
			{"native_token":true,"balance":"1500000000000000000"}
		]}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	bal, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "1500000000000000000" {
		t.Errorf("balance = %q, want native token balance", bal.Balance)
	}
}

func TestGetTokenBalances_Success_MapsDTOToDomain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"data":{"items":[
			{"native_token":true,"balance":"1"},
			{"contract_address":"0xtoken","contract_name":"USD Coin","contract_ticker_symbol":"USDC",
			 "contract_decimals":6,"balance":"1000000","quote_rate":1.0,"quote":1.0,"logo_url":"https://x/logo.png","is_spam":false},
			{"contract_address":"0xspam","is_spam":true,"balance":"1"}
		]}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	tokens, err := c.GetTokenBalances(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) != 1 {
		t.Fatalf("got %d tokens, want 1 (native + spam filtered out)", len(tokens))
	}
	got := tokens[0]
	if got.Symbol != "USDC" || got.TokenAddress != "0xtoken" || got.Decimals != "6" {
		t.Errorf("unexpected mapped token: %+v", got)
	}
}

func TestGetTransactions_Success_PaginationFromLinks(t *testing.T) {
	var gotPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		if r.URL.Query().Get("no-logs") != "true" {
			t.Errorf("expected no-logs=true for plain GetTransactions, got %q", r.URL.RawQuery)
		}
		w.Write([]byte(`{"data":{
			"current_page":0,
			"links":{"prev":"","next":"/v1/eth-mainnet/address/0xabc/transactions_v3/page/1/"},
			"items":[{"tx_hash":"0xhash1","from_address":"0xfrom","to_address":"0xto","value":"100",
				"block_height":123,"block_signed_at":"2024-01-01T00:00:00Z","gas_offered":21000,"gas_price":1,"fees_paid":"21000"}]
		}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	page, err := c.GetTransactions(context.Background(), "0xabc", "eth", domain.Pagination{Page: 0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotPath != "/eth-mainnet/address/0xabc/transactions_v3/page/0/" {
		t.Errorf("unexpected request path: %s", gotPath)
	}
	if len(page.Items) != 1 || page.Items[0].Hash != "0xhash1" {
		t.Fatalf("unexpected items: %+v", page.Items)
	}
	if !page.Page.HasMore {
		t.Errorf("expected HasMore=true because links.next is set")
	}
	if page.Page.PageSize != fixedPageSize {
		t.Errorf("PageSize = %d, want %d (GoldRush's fixed page size)", page.Page.PageSize, fixedPageSize)
	}
}

func TestGetTokenTransfers_Success_ExtractsERC20TransfersOnly(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("no-logs") == "true" {
			t.Errorf("GetTokenTransfers must request logs (no-logs should be unset)")
		}
		w.Write([]byte(`{"data":{
			"current_page":0,
			"links":{"next":""},
			"items":[{
				"tx_hash":"0xhash1","block_height":123,"block_signed_at":"2024-01-01T00:00:00Z",
				"log_events":[
					{
						"sender_address":"0xusdc","sender_name":"USD Coin","sender_contract_ticker_symbol":"USDC",
						"sender_contract_decimals":6,"supports_erc":["erc20"],
						"decoded":{"name":"Transfer","signature":"Transfer(address,address,uint256)",
							"params":[{"name":"from","value":"0xfrom"},{"name":"to","value":"0xto"},{"name":"value","value":"42"}]}
					},
					{
						"sender_address":"0xnft","supports_erc":["erc721"],
						"decoded":{"name":"Transfer","signature":"Transfer(address,address,uint256)",
							"params":[{"name":"from","value":"0xfrom"},{"name":"to","value":"0xto"},{"name":"tokenId","value":"7"}]}
					},
					{
						"sender_address":"0xother","supports_erc":["erc20"],
						"decoded":{"name":"Approval","params":[]}
					}
				]
			}]
		}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	page, err := c.GetTokenTransfers(context.Background(), "0xabc", "eth", domain.Pagination{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Items) != 1 {
		t.Fatalf("got %d transfers, want exactly 1 (ERC-721 and non-Transfer events must be excluded): %+v", len(page.Items), page.Items)
	}
	tr := page.Items[0]
	if tr.ContractAddress != "0xusdc" || tr.FromAddress != "0xfrom" || tr.ToAddress != "0xto" || tr.Value != "42" {
		t.Errorf("unexpected mapped transfer: %+v", tr)
	}
}

func TestGet_InvalidJSON_ReturnsErrInvalidResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{not valid json`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrInvalidResponse) {
		t.Fatalf("err = %v, want ErrInvalidResponse", err)
	}
}

func TestGet_401_ReturnsErrAuthFailed(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":true,"error_message":"invalid api key"}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrAuthFailed) {
		t.Fatalf("err = %v, want ErrAuthFailed", err)
	}
	if err != nil && strings.Contains(err.Error(), "test-key") {
		t.Fatalf("error message must never contain the API key: %v", err)
	}
}

func TestGet_429_ReturnsErrRateLimit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrRateLimit) {
		t.Fatalf("err = %v, want ErrRateLimit", err)
	}
}

func TestGet_500_ReturnsErrUnavailable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
}

func TestGet_Timeout_ReturnsErrTimeout(t *testing.T) {
	block := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-block // never respond within the test's deadline
	}))
	// srv.Close() blocks until outstanding handlers return, so close(block)
	// must run BEFORE srv.Close() — defers run LIFO, so register Close first.
	defer srv.Close()
	defer close(block)

	c := newTestClient(srv, "test-key")
	c.httpClient = &http.Client{Timeout: 20 * time.Millisecond}

	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrTimeout) {
		t.Fatalf("err = %v, want ErrTimeout", err)
	}
}

func TestGet_ContextCanceled_ReturnsErrTimeout(t *testing.T) {
	block := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-block
	}))
	defer srv.Close()
	defer close(block)

	c := newTestClient(srv, "test-key")
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()

	_, err := c.GetNativeBalance(ctx, "0xabc", "eth")
	if !errors.Is(err, provider.ErrTimeout) {
		t.Fatalf("err = %v, want ErrTimeout", err)
	}
}

func TestGetNativeBalance_UnsupportedChain_NoHTTPCall(t *testing.T) {
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "not-a-real-chain")
	if !errors.Is(err, provider.ErrNotSupported) {
		t.Fatalf("err = %v, want ErrNotSupported", err)
	}
	if calls.Load() != 0 {
		t.Errorf("expected no HTTP request for an unsupported chain, got %d", calls.Load())
	}
}

func TestGetNativeBalance_MissingAPIKey_NoHTTPCall(t *testing.T) {
	var calls atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
	}))
	defer srv.Close()

	c := newTestClient(srv, "") // missing configuration
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrMissingAPIKey) {
		t.Fatalf("err = %v, want ErrMissingAPIKey", err)
	}
	if calls.Load() != 0 {
		t.Errorf("expected no HTTP request when the API key is missing, got %d", calls.Load())
	}
}
