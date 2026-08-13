package ankr

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

func newTestClient(srv *httptest.Server) *Client {
	return &Client{
		endpoint:   srv.URL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

func TestGetNativeBalance_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"result":{"assets":[{"tokenType":"ERC20","balanceRawInteger":"1"},{"tokenType":"NATIVE","balanceRawInteger":"3000000000000000000"}]}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv)
	bal, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "3000000000000000000" {
		t.Errorf("balance = %q", bal.Balance)
	}
}

func TestGetTokenBalances_Success_MapsDTOToDomain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"result":{"assets":[
			{"tokenType":"NATIVE","balanceRawInteger":"1"},
			{"tokenType":"ERC20","contractAddress":"0xusdc","tokenName":"USD Coin","tokenSymbol":"USDC","tokenDecimals":6,"balanceRawInteger":"1000000","balance":"1","balanceUsd":"1.00","tokenPrice":"1.00"}
		]}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv)
	tokens, err := c.GetTokenBalances(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) != 1 || tokens[0].Symbol != "USDC" || tokens[0].TokenAddress != "0xusdc" {
		t.Fatalf("unexpected mapped tokens: %+v", tokens)
	}
}

func TestGetTransactions_Success_HasMoreFromNextPageToken(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"result":{"nextPageToken":"tok","transactions":[{"hash":"0xhash1","from":"0xfrom","to":"0xto","value":"1","gas":"21000","gasPrice":"1","blockNumber":"1","timestamp":"2024-01-01T00:00:00Z"}]}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv)
	page, err := c.GetTransactions(context.Background(), "0xabc", "eth", domain.Pagination{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Hash != "0xhash1" {
		t.Fatalf("unexpected items: %+v", page.Items)
	}
	if !page.Page.HasMore {
		t.Errorf("expected HasMore=true because nextPageToken was returned")
	}
}

func TestGetTokenTransfers_NotSupported(t *testing.T) {
	c := &Client{}
	_, err := c.GetTokenTransfers(context.Background(), "0xabc", "eth", domain.Pagination{})
	if !errors.Is(err, provider.ErrNotSupported) {
		t.Fatalf("err = %v, want ErrNotSupported (documented Ankr limitation)", err)
	}
}

func TestCall_HTTP429_ReturnsErrRateLimit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer srv.Close()

	c := newTestClient(srv)
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrRateLimit) {
		t.Fatalf("err = %v, want ErrRateLimit", err)
	}
}

func TestCall_JSONRPCRateLimitCode_ReturnsErrRateLimit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"error":{"code":-32005,"message":"rate limited"}}`))
	}))
	defer srv.Close()

	c := newTestClient(srv)
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrRateLimit) {
		t.Fatalf("err = %v, want ErrRateLimit (JSON-RPC -32005)", err)
	}
}

func TestCall_401_ReturnsErrAuthFailed(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	c := newTestClient(srv)
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrAuthFailed) {
		t.Fatalf("err = %v, want ErrAuthFailed", err)
	}
}

func TestCall_500_ReturnsErrUnavailable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	c := newTestClient(srv)
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrUnavailable) {
		t.Fatalf("err = %v, want ErrUnavailable", err)
	}
}

func TestCall_InvalidJSON_ReturnsErrInvalidResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`not json`))
	}))
	defer srv.Close()

	c := newTestClient(srv)
	_, err := c.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, provider.ErrInvalidResponse) {
		t.Fatalf("err = %v, want ErrInvalidResponse", err)
	}
}
