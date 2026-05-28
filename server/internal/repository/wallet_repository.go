package repository

import (
	"context"
	"sync"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
)

type inMemoryWalletRepo struct {
	mu      sync.RWMutex
	wallets map[string]*domain.Wallet
}

var _ usecase.WalletRepository = (*inMemoryWalletRepo)(nil)

// NewWalletRepository returns an in-memory WalletRepository.
func NewWalletRepository() usecase.WalletRepository {
	return &inMemoryWalletRepo{
		wallets: make(map[string]*domain.Wallet),
	}
}

func (r *inMemoryWalletRepo) FindByAddress(ctx context.Context, address string) (*domain.Wallet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	w, ok := r.wallets[address]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return w, nil
}

