package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// WalletUsecase is the inbound port for wallet lookups.
type WalletUsecase interface {
	GetWallet(ctx context.Context, address string) (*domain.Wallet, error)
}

type walletUsecase struct {
	repo WalletRepository
}

var _ WalletUsecase = (*walletUsecase)(nil)

func NewWalletUsecase(repo WalletRepository) WalletUsecase {
	return &walletUsecase{repo: repo}
}

func (u *walletUsecase) GetWallet(ctx context.Context, address string) (*domain.Wallet, error) {
	return u.repo.FindByAddress(ctx, address)
}

