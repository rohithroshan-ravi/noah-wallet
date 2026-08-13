package moralis

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
)

func newTestClient(srv *httptest.Server, apiKey string) *Client {
	return &Client{
		apiKey:     apiKey,
		baseURL:    srv.URL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

func TestGetNativeBalance_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-API-Key"); got != "test-key" {
			t.Errorf("X-API-Key = %q, want test-key", got)
		}
		w.Write([]byte(`{"balance":"2000000000000000000"}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	bal, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "2000000000000000000" {
		t.Errorf("balance = %q", bal.Balance)
	}
}

func TestGetTokenBalances_Success_MapsDTOToDomain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"result":[{"token_address":"0xtoken","symbol":"USDC","name":"USD Coin","decimals":"6","balance":"1000000","balance_formatted":"1","usd_price":"1.00","usd_value":"1.00","possible_spam":false}]}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	tokens, err := c.GetTokenBalances(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) != 1 || tokens[0].Symbol != "USDC" || tokens[0].TokenAddress != "0xtoken" {
		t.Fatalf("unexpected mapped tokens: %+v", tokens)
	}
}

func TestGetTransactions_Success_HasMoreFromCursor(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"cursor":"opaque-cursor","result":[{"hash":"0xhash1","from_address":"0xfrom","to_address":"0xto","value":"1","block_number":"1","block_timestamp":"2024-01-01T00:00:00Z","gas":"21000","gas_price":"1","transaction_fee":"21000"}]}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	page, err := c.GetTransactions(context.Background(), "0xabc", "eth", domain.Pagination{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Hash != "0xhash1" {
		t.Fatalf("unexpected items: %+v", page.Items)
	}
	if !page.Page.HasMore {
		t.Errorf("expected HasMore=true because a cursor was returned")
	}
}

func TestGetTokenTransfers_Success_MapsDTOToDomain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/0xabc/erc20/transfers" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Write([]byte(`{"cursor":"","result":[{"transaction_hash":"0xhash1","address":"0xusdc","from_address":"0xfrom","to_address":"0xto","value":"42","block_timestamp":"2024-01-01T00:00:00Z","block_number":"1","token_name":"USD Coin","token_symbol":"USDC","token_decimals":"6"}]}`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	page, err := c.GetTokenTransfers(context.Background(), "0xabc", "eth", domain.Pagination{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].ContractAddress != "0xusdc" || page.Items[0].TokenSymbol != "USDC" {
		t.Fatalf("unexpected transfers: %+v", page.Items)
	}
	if page.Page.HasMore {
		t.Errorf("expected HasMore=false because cursor is empty")
	}
}

func TestGet_401_ReturnsErrAuthFailed(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	c := newTestClient(srv, "bad-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrAuthFailed) {
		t.Fatalf("err = %v, want ErrAuthFailed", err)
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

func TestGet_InvalidJSON_ReturnsErrInvalidResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`not json`))
	}))
	defer srv.Close()

	c := newTestClient(srv, "test-key")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrInvalidResponse) {
		t.Fatalf("err = %v, want ErrInvalidResponse", err)
	}
}

func TestGet_MissingAPIKey_NoHTTPCall(t *testing.T) {
	called := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}))
	defer srv.Close()

	c := newTestClient(srv, "")
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrMissingAPIKey) {
		t.Fatalf("err = %v, want ErrMissingAPIKey", err)
	}
	if called {
		t.Errorf("expected no HTTP request when the API key is missing")
	}
}
