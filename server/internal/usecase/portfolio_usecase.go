package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// PortfolioUsecase is the inbound port for all on-chain portfolio reads.
type PortfolioUsecase interface {
	GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error)
	GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error)
	GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error)
	GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error)
	GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error)
	GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error)
	GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error)
	GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error)
	GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error)
	GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error)
	ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error)
	GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error)
}

type portfolioUsecase struct {
	blockchain BlockchainDataService
}

var _ PortfolioUsecase = (*portfolioUsecase)(nil)

func NewPortfolioUsecase(svc BlockchainDataService) PortfolioUsecase {
	return &portfolioUsecase{blockchain: svc}
}

func (u *portfolioUsecase) GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error) {
	return u.blockchain.GetNativeBalance(ctx, address, chain)
}

func (u *portfolioUsecase) GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error) {
	return u.blockchain.GetTokenBalances(ctx, address, chain)
}

func (u *portfolioUsecase) GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error) {
	return u.blockchain.GetNFTs(ctx, address, chain)
}

func (u *portfolioUsecase) GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error) {
	return u.blockchain.GetWalletHistory(ctx, address, chain)
}

func (u *portfolioUsecase) GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error) {
	return u.blockchain.GetTransactions(ctx, address, chain, page)
}

func (u *portfolioUsecase) GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error) {
	return u.blockchain.GetTokenTransfers(ctx, address, chain, page)
}

func (u *portfolioUsecase) GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error) {
	return u.blockchain.GetDeFiPositions(ctx, address, chain)
}

func (u *portfolioUsecase) GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error) {
	return u.blockchain.GetNetWorth(ctx, address, chains)
}

func (u *portfolioUsecase) GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error) {
	return u.blockchain.GetPnLSummary(ctx, address, chain, days)
}

func (u *portfolioUsecase) GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error) {
	return u.blockchain.GetPnLBreakdown(ctx, address, chain, days)
}

func (u *portfolioUsecase) ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error) {
	return u.blockchain.ResolveENS(ctx, address)
}

func (u *portfolioUsecase) GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error) {
	return u.blockchain.GetApprovals(ctx, address, chain)
}
