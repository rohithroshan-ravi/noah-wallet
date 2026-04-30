package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

type walletUsecase struct {
	repo domain.WalletRepository
}

// NewWalletUsecase creates a WalletUsecase backed by the given repository.
func NewWalletUsecase(repo domain.WalletRepository) domain.WalletUsecase {
	return &walletUsecase{repo: repo}
}

func (u *walletUsecase) GetWallet(ctx context.Context, address string) (*domain.Wallet, error) {
	return u.repo.FindByAddress(ctx, address)
}

func (u *walletUsecase) CreateWallet(ctx context.Context, wallet *domain.Wallet) error {
	return u.repo.Save(ctx, wallet)
}
