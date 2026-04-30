package ethutil

import "regexp"

var (
	reAddress   = regexp.MustCompile(`(?i)^0x[0-9a-f]{40}$`)
	validChains = map[string]bool{
		"eth": true, "0x1": true,
		"polygon": true, "0x89": true,
		"bsc": true, "0x38": true,
		"avalanche": true, "0xa86a": true,
		"arbitrum": true, "0xa4b1": true,
		"optimism": true, "0xa": true,
		"base": true, "0x2105": true,
		"linea": true, "0xe708": true,
		"fantom": true, "0xfa": true,
		"cronos": true, "0x19": true,
	}
)

// ValidAddress returns true when s is a valid checksummed or lowercase EVM address.
func ValidAddress(s string) bool {
	return reAddress.MatchString(s)
}

// ValidChain returns true when chain is a known Moralis chain identifier.
func ValidChain(chain string) bool {
	return validChains[chain]
}
