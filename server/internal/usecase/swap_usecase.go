package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// SwapUsecase is the inbound port for LI.FI swap/bridge operations.
type SwapUsecase interface {
	GetChains(ctx context.Context) ([]domain.LifiChain, error)
	GetTokens(ctx context.Context, chainID int) ([]domain.LifiToken, error)
	GetQuote(ctx context.Context, params domain.LifiQuoteParams) (*domain.LifiQuote, error)
}

type swapUsecase struct {
	lifi LifiService
}

var _ SwapUsecase = (*swapUsecase)(nil)

func NewSwapUsecase(svc LifiService) SwapUsecase {
	return &swapUsecase{lifi: svc}
}

func (u *swapUsecase) GetChains(ctx context.Context) ([]domain.LifiChain, error) {
	return u.lifi.GetChains(ctx)
}

func (u *swapUsecase) GetTokens(ctx context.Context, chainID int) ([]domain.LifiToken, error) {
	return u.lifi.GetTokens(ctx, chainID)
}

func (u *swapUsecase) GetQuote(ctx context.Context, params domain.LifiQuoteParams) (*domain.LifiQuote, error) {
	return u.lifi.GetQuote(ctx, params)
}
