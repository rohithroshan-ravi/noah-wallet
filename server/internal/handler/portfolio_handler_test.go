package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
)

// fakeUsecase is a minimal usecase.PortfolioUsecase double. Every method
// that isn't relevant to a given test just fails loudly so a test can't pass
// by accident on an unintended code path.
type fakeUsecase struct {
	t                *testing.T
	transactionsPage domain.Pagination
	called           bool
}

func (f *fakeUsecase) GetTransactions(_ context.Context, _, _ string, page domain.Pagination) (domain.TransactionPage, error) {
	f.called = true
	f.transactionsPage = page
	return domain.TransactionPage{Items: []domain.Transaction{{Hash: "0xhash1"}}, Page: domain.PageInfo{Page: page.Page, PageSize: page.PageSize}}, nil
}

func (f *fakeUsecase) unexpected(name string) {
	f.t.Helper()
	f.t.Fatalf("unexpected call to %s — request should have been rejected before reaching the usecase", name)
}

func (f *fakeUsecase) GetNativeBalance(context.Context, string, string) (*domain.NativeBalance, error) {
	f.unexpected("GetNativeBalance")
	return nil, nil
}
func (f *fakeUsecase) GetTokenBalances(context.Context, string, string) ([]domain.Token, error) {
	f.unexpected("GetTokenBalances")
	return nil, nil
}
func (f *fakeUsecase) GetNFTs(context.Context, string, string) ([]domain.NFT, error) {
	f.unexpected("GetNFTs")
	return nil, nil
}
func (f *fakeUsecase) GetWalletHistory(context.Context, string, string) ([]domain.HistoryEntry, error) {
	f.unexpected("GetWalletHistory")
	return nil, nil
}
func (f *fakeUsecase) GetTokenTransfers(context.Context, string, string, domain.Pagination) (domain.TokenTransferPage, error) {
	f.unexpected("GetTokenTransfers")
	return domain.TokenTransferPage{}, nil
}
func (f *fakeUsecase) GetDeFiPositions(context.Context, string, string) ([]domain.DeFiPosition, error) {
	f.unexpected("GetDeFiPositions")
	return nil, nil
}
func (f *fakeUsecase) GetNetWorth(context.Context, string, []string) (*domain.NetWorth, error) {
	f.unexpected("GetNetWorth")
	return nil, nil
}
func (f *fakeUsecase) GetPnLSummary(context.Context, string, string, int) (*domain.PnLSummary, error) {
	f.unexpected("GetPnLSummary")
	return nil, nil
}
func (f *fakeUsecase) GetPnLBreakdown(context.Context, string, string, int) ([]domain.TokenPnL, error) {
	f.unexpected("GetPnLBreakdown")
	return nil, nil
}
func (f *fakeUsecase) ResolveENS(context.Context, string) (*domain.ENSInfo, error) {
	f.unexpected("ResolveENS")
	return nil, nil
}
func (f *fakeUsecase) GetApprovals(context.Context, string, string) ([]domain.Approval, error) {
	f.unexpected("GetApprovals")
	return nil, nil
}

var _ usecase.PortfolioUsecase = (*fakeUsecase)(nil)

func doRequest(t *testing.T, uc *fakeUsecase, address, rawQuery string) *httptest.ResponseRecorder {
	t.Helper()
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/?"+rawQuery, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("address")
	c.SetParamValues(address)

	h := NewPortfolioHandler(uc)
	if err := h.GetTransactions(c); err != nil {
		t.Fatalf("handler returned error: %v", err)
	}
	return rec
}

func TestGetTransactions_InvalidAddress_RejectedBeforeUsecase(t *testing.T) {
	uc := &fakeUsecase{t: t}
	rec := doRequest(t, uc, "not-an-address", "chain=eth")

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
	if uc.called {
		t.Errorf("usecase should not be called for an invalid address")
	}
}

func TestGetTransactions_UnsupportedChain_RejectedBeforeUsecase(t *testing.T) {
	uc := &fakeUsecase{t: t}
	rec := doRequest(t, uc, "0x1234567890123456789012345678901234567890", "chain=solana")

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
	if uc.called {
		t.Errorf("usecase should not be called for an unsupported chain")
	}
}

func TestGetTransactions_PaginationIsClampedBeforeReachingUsecase(t *testing.T) {
	uc := &fakeUsecase{t: t}
	rec := doRequest(t, uc, "0x1234567890123456789012345678901234567890", "chain=eth&page=-3&pageSize=99999")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", rec.Code, rec.Body.String())
	}
	if !uc.called {
		t.Fatalf("expected the usecase to be called for a valid request")
	}
	if uc.transactionsPage.Page != 0 {
		t.Errorf("page = %d, want clamped to 0", uc.transactionsPage.Page)
	}
	if uc.transactionsPage.PageSize != maxPageSize {
		t.Errorf("pageSize = %d, want clamped to %d", uc.transactionsPage.PageSize, maxPageSize)
	}
}

func TestGetTransactions_DefaultChainIsEthereum(t *testing.T) {
	uc := &fakeUsecase{t: t}
	rec := doRequest(t, uc, "0x1234567890123456789012345678901234567890", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", rec.Code, rec.Body.String())
	}
	if !uc.called {
		t.Fatalf("expected the usecase to be called when chain is omitted")
	}
}
