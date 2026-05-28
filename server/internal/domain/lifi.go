package domain

// LifiChain represents an EVM-compatible blockchain supported by LI.FI.
type LifiChain struct {
	Key         string          `json:"key"`
	Name        string          `json:"name"`
	ID          int             `json:"id"`
	Coin        string          `json:"coin"`
	ChainType   string          `json:"chainType"`
	Mainnet     bool            `json:"mainnet"`
	LogoURI     string          `json:"logoURI,omitempty"`
	NativeToken LifiNativeToken `json:"nativeToken"`
	Metamask    *LifiMetamask   `json:"metamask,omitempty"`
}

// LifiNativeToken is the native currency info for a chain.
type LifiNativeToken struct {
	Address  string `json:"address"`
	Symbol   string `json:"symbol"`
	Decimals int    `json:"decimals"`
	ChainID  int    `json:"chainId"`
	Name     string `json:"name"`
}

// LifiMetamask holds the wallet_addEthereumChain-compatible fields.
type LifiMetamask struct {
	ChainID           string   `json:"chainId"`
	ChainName         string   `json:"chainName"`
	RpcUrls           []string `json:"rpcUrls,omitempty"`
	BlockExplorerUrls []string `json:"blockExplorerUrls,omitempty"`
}

// LifiToken represents a token supported by LI.FI on a given chain.
type LifiToken struct {
	Address  string `json:"address"`
	Symbol   string `json:"symbol"`
	Name     string `json:"name"`
	Decimals int    `json:"decimals"`
	ChainID  int    `json:"chainId"`
	LogoURI  string `json:"logoURI,omitempty"`
	PriceUSD string `json:"priceUSD,omitempty"`
}

// LifiQuoteParams holds the input parameters for a swap/bridge quote.
type LifiQuoteParams struct {
	FromChain   int
	ToChain     int
	FromToken   string
	ToToken     string
	FromAmount  string
	FromAddress string
	Slippage    float64
}

// LifiGasCost is a single gas cost entry returned in a quote estimate.
type LifiGasCost struct {
	Amount    string    `json:"amount"`
	AmountUSD string    `json:"amountUSD,omitempty"`
	Token     LifiToken `json:"token"`
}

// LifiEstimate holds the swap estimate details from a quote.
type LifiEstimate struct {
	FromAmount        string        `json:"fromAmount"`
	ToAmount          string        `json:"toAmount"`
	ToAmountMin       string        `json:"toAmountMin"`
	GasCosts          []LifiGasCost `json:"gasCosts"`
	ExecutionDuration float64       `json:"executionDuration"`
	FromAmountUSD     string        `json:"fromAmountUSD,omitempty"`
	ToAmountUSD       string        `json:"toAmountUSD,omitempty"`
}

// LifiTransactionRequest is a ready-to-sign EVM transaction from LI.FI.
type LifiTransactionRequest struct {
	From     string `json:"from"`
	To       string `json:"to"`
	Data     string `json:"data"`
	Value    string `json:"value"`
	GasPrice string `json:"gasPrice,omitempty"`
	GasLimit string `json:"gasLimit,omitempty"`
	ChainID  int    `json:"chainId"`
}

// LifiQuoteAction describes what the swap does.
type LifiQuoteAction struct {
	FromToken   LifiToken `json:"fromToken"`
	ToToken     LifiToken `json:"toToken"`
	FromAmount  string    `json:"fromAmount"`
	Slippage    float64   `json:"slippage"`
	FromChainID int       `json:"fromChainId"`
	ToChainID   int       `json:"toChainId"`
}

// LifiQuote is the full response from a LI.FI /quote call.
type LifiQuote struct {
	TransactionRequest LifiTransactionRequest `json:"transactionRequest"`
	Estimate           LifiEstimate           `json:"estimate"`
	Action             LifiQuoteAction        `json:"action"`
}
