package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

type portfolioUsecase struct {
	moralis domain.MoralisService
}

// NewPortfolioUsecase creates a PortfolioUsecase backed by MoralisService.
func NewPortfolioUsecase(svc domain.MoralisService) domain.PortfolioUsecase {
	return &portfolioUsecase{moralis: svc}
}

func (u *portfolioUsecase) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	return u.moralis.GetNativeBalance(ctx, address, chain)
}

func (u *portfolioUsecase) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	return u.moralis.GetTokenBalances(ctx, address, chain)
}

func (u *portfolioUsecase) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	return u.moralis.GetNFTs(ctx, address, chain)
}

func (u *portfolioUsecase) GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error) {
	return u.moralis.GetWalletHistory(ctx, address, chain)
}

func (u *portfolioUsecase) GetTransactions(ctx context.Context, address, chain string) ([]domain.Transaction, error) {
	return u.moralis.GetTransactions(ctx, address, chain)
}

func (u *portfolioUsecase) GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error) {
	return u.moralis.GetDeFiPositions(ctx, address, chain)
}

func (u *portfolioUsecase) GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error) {
	return u.moralis.GetNetWorth(ctx, address, chains)
}

func (u *portfolioUsecase) GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error) {
	return u.moralis.GetPnLSummary(ctx, address, chain, days)
}

func (u *portfolioUsecase) GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error) {
	return u.moralis.GetPnLBreakdown(ctx, address, chain, days)
}

func (u *portfolioUsecase) ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error) {
	return u.moralis.ResolveENS(ctx, address)
}

func (u *portfolioUsecase) GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error) {
	return u.moralis.GetApprovals(ctx, address, chain)
}
