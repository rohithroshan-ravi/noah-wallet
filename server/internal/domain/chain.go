package domain

import "errors"

// Chain is the application's single internal representation of an EVM
// network. Every provider adapter (Moralis, GoldRush, Ankr) maps a Chain to
// its own vendor-specific chain identifier internally — nothing outside the
// provider package should ever see a vendor chain string like
// "eth-mainnet" or "0x2105".
//
// Chain values intentionally match the identifiers already used throughout
// this API and consumed by the existing frontend clients (extension/website)
// — e.g. ChainEthereum is "eth", not "ethereum" — so introducing this type
// does not change the wire contract for existing callers.
type Chain string

const (
	ChainEthereum  Chain = "eth"
	ChainPolygon   Chain = "polygon"
	ChainBSC       Chain = "bsc"
	ChainAvalanche Chain = "avalanche"
	ChainArbitrum  Chain = "arbitrum"
	ChainOptimism  Chain = "optimism"
	ChainBase      Chain = "base"
	ChainFantom    Chain = "fantom"
	ChainLinea     Chain = "linea"
	ChainCronos    Chain = "cronos"
)

// ErrUnsupportedChain is returned by ParseChain for any identifier that isn't
// a recognized Chain or alias. Handlers map it to HTTP 400 — it is a request
// validation error, not a provider-availability error (contrast with
// provider.ErrNotSupported, which means "this specific provider lacks the
// requested capability/chain", triggering failover instead of a 400).
var ErrUnsupportedChain = errors.New("unsupported chain")

// supportedChains is the single source of truth for which Chain values are
// valid. Add a new chain here — and to each provider's own vendor-chain
// mapping — to support it; nowhere else in the codebase should need to know
// the full chain list.
var supportedChains = map[Chain]bool{
	ChainEthereum:  true,
	ChainPolygon:   true,
	ChainBSC:       true,
	ChainAvalanche: true,
	ChainArbitrum:  true,
	ChainOptimism:  true,
	ChainBase:      true,
	ChainFantom:    true,
	ChainLinea:     true,
	ChainCronos:    true,
}

// chainAliases maps alternate identifiers — currently hex EVM chain IDs,
// which some existing callers pass instead of the slug — to their canonical
// Chain. ParseChain resolves both forms to the same single internal value.
var chainAliases = map[string]Chain{
	"0x1":    ChainEthereum,
	"0x89":   ChainPolygon,
	"0x38":   ChainBSC,
	"0xa86a": ChainAvalanche,
	"0xa4b1": ChainArbitrum,
	"0xa":    ChainOptimism,
	"0x2105": ChainBase,
	"0xfa":   ChainFantom,
	"0xe708": ChainLinea,
	"0x19":   ChainCronos,
}

// ParseChain validates and canonicalizes a caller-supplied chain identifier
// (either a Chain slug or one of its hex chain-ID aliases) into the single
// internal Chain representation. It is the one place chain validation
// happens — providers receive an already-validated Chain and only need to
// map it to their own vendor identifier.
func ParseChain(raw string) (Chain, error) {
	if c, ok := chainAliases[raw]; ok {
		return c, nil
	}
	c := Chain(raw)
	if supportedChains[c] {
		return c, nil
	}
	return "", ErrUnsupportedChain
}
