package main

import (
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/rohithroshan-ravi/noah-wallet/server/config"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider/ankr"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider/covalent"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/repository"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/router"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/service/lifi"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/service/moralis"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
)

func main() {
	cfg := config.Load()

	e := echo.New()
	e.HideBanner = true
	e.Use(echomw.RequestID())
	e.Use(echomw.Logger())
	e.Use(echomw.Recover())
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: cfg.AllowedOrigins,
	}))

	walletRepo := repository.NewWalletRepository()
	walletUC := usecase.NewWalletUsecase(walletRepo)

	blockchain := provider.NewFailover(
		moralis.New(cfg.MoralisAPIKey),
		covalent.New(cfg.CovalentAPIKey),
		ankr.New(cfg.AnkrAPIKey),
	)
	portfolioUC := usecase.NewPortfolioUsecase(blockchain)

	lifiSvc := lifi.New()
	swapUC := usecase.NewSwapUsecase(lifiSvc)

	router.Register(e, walletUC, portfolioUC, swapUC, cfg.APIKeys)

	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
