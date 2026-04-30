package repository

import (
	"context"
	"errors"
	"sync"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

type inMemoryWalletRepo struct {
	mu      sync.RWMutex
	wallets map[string]*domain.Wallet
}

// NewWalletRepository returns an in-memory WalletRepository.
// Replace with a real DB implementation when needed.
func NewWalletRepository() domain.WalletRepository {
	return &inMemoryWalletRepo{
		wallets: make(map[string]*domain.Wallet),
	}
}

func (r *inMemoryWalletRepo) FindByAddress(ctx context.Context, address string) (*domain.Wallet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	w, ok := r.wallets[address]
	if !ok {
		return nil, errors.New("wallet not found")
	}
	return w, nil
}

func (r *inMemoryWalletRepo) Save(ctx context.Context, wallet *domain.Wallet) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.wallets[wallet.Address] = wallet
	return nil
}
