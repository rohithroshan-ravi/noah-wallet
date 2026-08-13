// Package ethutil holds small, dependency-free EVM validation helpers.
//
// Chain identifier validation used to live here as a plain string allow-list,
// but chain validation/canonicalization is now centralized in
// domain.ParseChain (see internal/domain/chain.go) so there is exactly one
// source of truth for "what chain identifiers does this app accept" instead
// of two maps that could drift apart.
package ethutil

import "regexp"

var reAddress = regexp.MustCompile(`(?i)^0x[0-9a-f]{40}$`)

// ValidAddress returns true when s is a valid checksummed or lowercase EVM address.
func ValidAddress(s string) bool {
	return reAddress.MatchString(s)
}
