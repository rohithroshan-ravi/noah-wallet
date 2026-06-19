package provider

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// cooldown is how long a rate-limited provider is skipped before being retried.
const cooldown = 60 * time.Second

// Failover wraps multiple BlockchainProvider implementations and automatically
// switches to the next one when the current provider is rate-limited (ErrRateLimit)
// or does not support the requested method (ErrNotSupported).
//
// Providers are tried in the order they are registered. A rate-limited provider
// is cooled down for cooldown seconds, after which it becomes eligible again.
//
// Failover itself implements BlockchainProvider, so callers see a single provider.
type Failover struct {
	providers []BlockchainProvider
	mu        sync.RWMutex
	limited   map[string]time.Time // name → rate-limit expiry
}

// NewFailover creates a Failover from the given providers in priority order.
// At least one provider must be supplied.
func NewFailover(providers ...BlockchainProvider) *Failover {
	return &Failover{
		providers: providers,
		limited:   make(map[string]time.Time),
	}
}

func (f *Failover) Name() string { return "failover" }

// active returns providers that are not currently cooling down.
// If all are cooling down, it falls back to the full list so calls are not
// permanently blocked.
func (f *Failover) active() []BlockchainProvider {
	f.mu.RLock()
	defer f.mu.RUnlock()
	now := time.Now()
	out := make([]BlockchainProvider, 0, len(f.providers))
	for _, p := range f.providers {
		if exp, ok := f.limited[p.Name()]; !ok || now.After(exp) {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return f.providers
	}
	return out
}

func (f *Failover) cool(name string) {
	f.mu.Lock()
	f.limited[name] = time.Now().Add(cooldown)
	f.mu.Unlock()
	log.Printf("[provider/failover] %s rate-limited — cooling down for %s", name, cooldown)
}

// run calls op against each active provider in order.
// It advances to the next provider only on ErrRateLimit (marking the provider
// as cooling) or ErrNotSupported. Any other error is returned immediately.
func run[T any](f *Failover, op func(BlockchainProvider) (T, error)) (T, error) {
	var zero T
	var lastErr error
	for _, p := range f.active() {
		v, err := op(p)
		if err == nil {
			return v, nil
		}
		if errors.Is(err, ErrRateLimit) {
			f.cool(p.Name())
			lastErr = err
			continue
		}
		if errors.Is(err, ErrNotSupported) {
			lastErr = err
			continue
		}
		return zero, err
	}
	return zero, lastErr
}

func (f *Failover) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	return run(f, func(p BlockchainProvider) (*domain.NativeBalance, error) {
		return p.GetNativeBalance(ctx, address, chain)
	})
}

func (f *Failover) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	return run(f, func(p BlockchainProvider) ([]domain.Token, error) {
		return p.GetTokenBalances(ctx, address, chain)
	})
}

func (f *Failover) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	return run(f, func(p BlockchainProvider) ([]domain.NFT, error) {
		return p.GetNFTs(ctx, address, chain)
	})
}

func (f *Failover) GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error) {
	return run(f, func(p BlockchainProvider) ([]domain.HistoryEntry, error) {
		return p.GetWalletHistory(ctx, address, chain)
	})
}

func (f *Failover) GetTransactions(ctx context.Context, address, chain string) ([]domain.Transaction, error) {
	return run(f, func(p BlockchainProvider) ([]domain.Transaction, error) {
		return p.GetTransactions(ctx, address, chain)
	})
}

func (f *Failover) GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error) {
	return run(f, func(p BlockchainProvider) ([]domain.DeFiPosition, error) {
		return p.GetDeFiPositions(ctx, address, chain)
	})
}

func (f *Failover) GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error) {
	return run(f, func(p BlockchainProvider) (*domain.NetWorth, error) {
		return p.GetNetWorth(ctx, address, chains)
	})
}

func (f *Failover) GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error) {
	return run(f, func(p BlockchainProvider) (*domain.PnLSummary, error) {
		return p.GetPnLSummary(ctx, address, chain, days)
	})
}

func (f *Failover) GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error) {
	return run(f, func(p BlockchainProvider) ([]domain.TokenPnL, error) {
		return p.GetPnLBreakdown(ctx, address, chain, days)
	})
}

func (f *Failover) ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error) {
	return run(f, func(p BlockchainProvider) (*domain.ENSInfo, error) {
		return p.ResolveENS(ctx, address)
	})
}

func (f *Failover) GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error) {
	return run(f, func(p BlockchainProvider) ([]domain.Approval, error) {
		return p.GetApprovals(ctx, address, chain)
	})
}
