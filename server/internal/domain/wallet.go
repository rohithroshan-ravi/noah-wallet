package domain

// ── Asset Holdings ───────────────────────────────────────────────────────────

// Wallet is a locally-stored wallet record.
type Wallet struct {
	Address string `json:"address"`
	Network string `json:"network"`
}

// NativeBalance is the raw wei balance of an address.
type NativeBalance struct {
	Balance string `json:"balance"`
}

// Token is an ERC-20 token balance entry with optional USD price.
type Token struct {
	TokenAddress     string `json:"token_address"`
	Symbol           string `json:"symbol"`
	Name             string `json:"name"`
	Decimals         string `json:"decimals"`
	Balance          string `json:"balance"`
	BalanceFormatted string `json:"balance_formatted,omitempty"`
	USDPrice         string `json:"usd_price,omitempty"`
	USDValue         string `json:"usd_value,omitempty"`
	Logo             string `json:"logo,omitempty"`
	PossibleSpam     bool   `json:"possible_spam"`
}

// NFT represents a single NFT owned by an address.
type NFT struct {
	TokenAddress string `json:"token_address"`
	TokenID      string `json:"token_id"`
	Name         string `json:"name"`
	Symbol       string `json:"symbol"`
	TokenURI     string `json:"token_uri,omitempty"`
	Metadata     string `json:"metadata,omitempty"`
	Amount       string `json:"amount"`
	ContractType string `json:"contract_type"`
}

// ── Transaction History ──────────────────────────────────────────────────────

// Transaction is a raw on-chain transaction.
type Transaction struct {
	Hash           string `json:"hash"`
	FromAddress    string `json:"from_address"`
	ToAddress      string `json:"to_address"`
	Value          string `json:"value"`
	BlockNumber    string `json:"block_number"`
	BlockTimestamp string `json:"block_timestamp"`
	Gas            string `json:"gas"`
	GasPrice       string `json:"gas_price"`
	TransactionFee string `json:"transaction_fee"`
}

// HistoryEntry is a single decoded wallet activity item (human-readable).
type HistoryEntry struct {
	Hash           string `json:"hash"`
	Category       string `json:"category"`
	Summary        string `json:"summary"`
	BlockTimestamp string `json:"block_timestamp"`
	BlockNumber    string `json:"block_number"`
	TransactionFee string `json:"transaction_fee"`
	FromAddress    string `json:"from_address"`
	ToAddress      string `json:"to_address"`
}

// ── DeFi Positions ───────────────────────────────────────────────────────────

// DeFiPosition represents a single DeFi protocol position.
type DeFiPosition struct {
	ProtocolID   string                 `json:"protocol_id"`
	ProtocolName string                 `json:"protocol_name"`
	ProtocolLogo string                 `json:"protocol_logo,omitempty"`
	Chain        string                 `json:"chain"`
	Position     map[string]interface{} `json:"position"`
}

// ── Financial Metrics ────────────────────────────────────────────────────────

// NetWorth is the aggregated USD value of all wallet holdings across chains.
type NetWorth struct {
	TotalNetworthUSD string       `json:"total_networth_usd"`
	Chains           []ChainWorth `json:"chains"`
}

// ChainWorth is the net worth contribution from a single chain.
type ChainWorth struct {
	Chain       string `json:"chain"`
	NetworthUSD string `json:"networth_usd"`
}

// PnLSummary is the aggregate profit/loss summary for a wallet.
type PnLSummary struct {
	TotalRealizedProfitUSD    string `json:"total_realized_profit_usd"`
	TotalUnrealisedProfitUSD  string `json:"total_unrealised_profit_usd"`
	TotalCountOfTrades        int    `json:"total_count_of_trades"`
	TotalCountOfWinningTrades int    `json:"total_count_of_winning_trades"`
	TotalCountOfLosingTrades  int    `json:"total_count_of_losing_trades"`
}

// TokenPnL is P&L data for a single token position.
type TokenPnL struct {
	TokenAddress        string `json:"token_address"`
	TokenSymbol         string `json:"token_symbol"`
	TokenName           string `json:"token_name"`
	RealizedProfitUSD   string `json:"realized_profit_usd"`
	UnrealisedProfitUSD string `json:"unrealised_profit_usd"`
	CountOfTrades       int    `json:"count_of_trades"`
	AvgBuyPriceUSD      string `json:"avg_buy_price_usd"`
	AvgSellPriceUSD     string `json:"avg_sell_price_usd"`
}

// ── Identity ─────────────────────────────────────────────────────────────────

// ENSInfo holds a resolved ENS name for an address.
type ENSInfo struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

// ── Approvals ────────────────────────────────────────────────────────────────

// Approval represents an active ERC-20 token allowance granted to a contract.
type Approval struct {
	TokenAddress   string `json:"token_address"`
	TokenSymbol    string `json:"token_symbol"`
	TokenName      string `json:"token_name"`
	Spender        string `json:"spender"`
	SpenderLabel   string `json:"spender_label,omitempty"`
	Value          string `json:"value"`
	ValueFormatted string `json:"value_formatted,omitempty"`
	BlockTimestamp string `json:"block_timestamp"`
}

