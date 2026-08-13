package provider

import (
	"context"
	"errors"
	"fmt"
	"sync/atomic"
	"testing"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// fakeProvider is a minimal, fully-interface-compliant BlockchainProvider
// double. Only GetNativeBalance is exercised by these tests; every other
// method returns ErrNotSupported so a fakeProvider can stand in anywhere the
// interface is required without extra boilerplate per test.
type fakeProvider struct {
	name    string
	calls   int32
	balance func() (*domain.NativeBalance, error)
}

func (f *fakeProvider) Name() string { return f.name }

func (f *fakeProvider) GetNativeBalance(_ context.Context, _, _ string) (*domain.NativeBalance, error) {
	atomic.AddInt32(&f.calls, 1)
	if f.balance != nil {
		return f.balance()
	}
	return nil, ErrNotSupported
}

func (f *fakeProvider) callCount() int32 { return atomic.LoadInt32(&f.calls) }

func (f *fakeProvider) GetTokenBalances(context.Context, string, string) ([]domain.Token, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetNFTs(context.Context, string, string) ([]domain.NFT, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetWalletHistory(context.Context, string, string) ([]domain.HistoryEntry, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetTransactions(context.Context, string, string, domain.Pagination) (domain.TransactionPage, error) {
	return domain.TransactionPage{}, ErrNotSupported
}
func (f *fakeProvider) GetTokenTransfers(context.Context, string, string, domain.Pagination) (domain.TokenTransferPage, error) {
	return domain.TokenTransferPage{}, ErrNotSupported
}
func (f *fakeProvider) GetDeFiPositions(context.Context, string, string) ([]domain.DeFiPosition, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetNetWorth(context.Context, string, []string) (*domain.NetWorth, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetPnLSummary(context.Context, string, string, int) (*domain.PnLSummary, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetPnLBreakdown(context.Context, string, string, int) ([]domain.TokenPnL, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) ResolveENS(context.Context, string) (*domain.ENSInfo, error) {
	return nil, ErrNotSupported
}
func (f *fakeProvider) GetApprovals(context.Context, string, string) ([]domain.Approval, error) {
	return nil, ErrNotSupported
}

var _ BlockchainProvider = (*fakeProvider)(nil)

func okBalance(bal string) func() (*domain.NativeBalance, error) {
	return func() (*domain.NativeBalance, error) { return &domain.NativeBalance{Balance: bal}, nil }
}

func failWith(err error) func() (*domain.NativeBalance, error) {
	return func() (*domain.NativeBalance, error) { return nil, err }
}

func TestFailover_Success_NoFallthrough(t *testing.T) {
	moralis := &fakeProvider{name: "moralis", balance: okBalance("111")}
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	bal, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "111" {
		t.Errorf("balance = %q, want the primary provider's result", bal.Balance)
	}
	if goldrush.callCount() != 0 {
		t.Errorf("secondary provider should never be called when the primary succeeds")
	}
}

func TestFailover_RateLimit_FallsThroughAndCoolsProvider(t *testing.T) {
	moralis := &fakeProvider{name: "moralis", balance: failWith(fmt.Errorf("moralis: %w", ErrRateLimit))}
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	bal, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "222" {
		t.Errorf("balance = %q, want fallback provider's result", bal.Balance)
	}

	// A second call immediately after should skip the still-cooling primary
	// entirely — it must not be retried within the 60s cooldown window.
	if _, err := f.GetNativeBalance(context.Background(), "0xabc", "eth"); err != nil {
		t.Fatalf("unexpected error on second call: %v", err)
	}
	if moralis.callCount() != 1 {
		t.Errorf("moralis calls = %d, want 1 (should stay cooled down across the second call)", moralis.callCount())
	}
	if goldrush.callCount() != 2 {
		t.Errorf("goldrush calls = %d, want 2", goldrush.callCount())
	}
}

func TestFailover_ServerError_FallsThrough(t *testing.T) {
	moralis := &fakeProvider{name: "moralis", balance: failWith(fmt.Errorf("moralis: %w", ErrUnavailable))}
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	bal, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "222" {
		t.Errorf("balance = %q, want fallback provider's result after a 5xx", bal.Balance)
	}
}

func TestFailover_Timeout_FallsThrough(t *testing.T) {
	moralis := &fakeProvider{name: "moralis", balance: failWith(fmt.Errorf("moralis: %w", ErrTimeout))}
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	bal, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bal.Balance != "222" {
		t.Errorf("balance = %q, want fallback provider's result after a timeout", bal.Balance)
	}
}

func TestFailover_NotSupported_FallsThroughWithoutCooldown(t *testing.T) {
	moralis := &fakeProvider{name: "moralis"} // balance is nil -> returns ErrNotSupported
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	if _, err := f.GetNativeBalance(context.Background(), "0xabc", "eth"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// ErrNotSupported is permanent for this provider (nothing will change
	// until redeploy), so it should NOT be cooled — it's tried every call.
	if _, err := f.GetNativeBalance(context.Background(), "0xabc", "eth"); err != nil {
		t.Fatalf("unexpected error on second call: %v", err)
	}
	if moralis.callCount() != 2 {
		t.Errorf("moralis calls = %d, want 2 (ErrNotSupported doesn't cool down)", moralis.callCount())
	}
}

func TestFailover_AllProvidersFail_ReturnsNormalizedError(t *testing.T) {
	moralis := &fakeProvider{name: "moralis", balance: failWith(fmt.Errorf("moralis: %w", ErrRateLimit))}
	goldrush := &fakeProvider{name: "goldrush", balance: failWith(fmt.Errorf("goldrush: %w", ErrUnavailable))}
	ankr := &fakeProvider{name: "ankr", balance: failWith(fmt.Errorf("ankr: %w", ErrAuthFailed))}
	f := NewFailover(moralis, goldrush, ankr)

	_, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if err == nil {
		t.Fatal("expected an error when every provider fails")
	}
	// The error surfaced is one of the app's own normalized provider.Err*
	// sentinels (whichever provider failed last) — never a raw upstream
	// detail — so a handler can map it without knowing which vendor it came
	// from.
	if !errors.Is(err, ErrRateLimit) && !errors.Is(err, ErrUnavailable) && !errors.Is(err, ErrAuthFailed) {
		t.Errorf("err = %v, want a normalized provider.Err* sentinel", err)
	}
	if moralis.callCount() != 1 || goldrush.callCount() != 1 || ankr.callCount() != 1 {
		t.Errorf("expected every provider to be tried exactly once: moralis=%d goldrush=%d ankr=%d",
			moralis.callCount(), goldrush.callCount(), ankr.callCount())
	}
}

func TestFailover_UnrelatedError_DoesNotFallThrough(t *testing.T) {
	boom := errors.New("boom: malformed caller input")
	moralis := &fakeProvider{name: "moralis", balance: failWith(boom)}
	goldrush := &fakeProvider{name: "goldrush", balance: okBalance("222")}
	f := NewFailover(moralis, goldrush)

	_, err := f.GetNativeBalance(context.Background(), "0xabc", "eth")
	if !errors.Is(err, boom) {
		t.Fatalf("err = %v, want the unrelated error returned as-is", err)
	}
	if goldrush.callCount() != 0 {
		t.Errorf("goldrush should never be tried for a non-provider error — a request-shaped error must not blindly fall back")
	}
}
