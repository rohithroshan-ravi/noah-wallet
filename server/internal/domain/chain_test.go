package domain

import (
	"errors"
	"testing"
)

func TestParseChain_EverySupportedChain(t *testing.T) {
	cases := []struct {
		slug string
		hex  string
		want Chain
	}{
		{"eth", "0x1", ChainEthereum},
		{"polygon", "0x89", ChainPolygon},
		{"bsc", "0x38", ChainBSC},
		{"avalanche", "0xa86a", ChainAvalanche},
		{"arbitrum", "0xa4b1", ChainArbitrum},
		{"optimism", "0xa", ChainOptimism},
		{"base", "0x2105", ChainBase},
		{"fantom", "0xfa", ChainFantom},
		{"linea", "0xe708", ChainLinea},
		{"cronos", "0x19", ChainCronos},
	}
	for _, tc := range cases {
		t.Run(tc.slug, func(t *testing.T) {
			got, err := ParseChain(tc.slug)
			if err != nil || got != tc.want {
				t.Errorf("ParseChain(%q) = (%q, %v), want (%q, nil)", tc.slug, got, err, tc.want)
			}
			// The hex chain-ID alias must resolve to the exact same canonical
			// value — callers downstream see ONE representation either way.
			gotHex, err := ParseChain(tc.hex)
			if err != nil || gotHex != tc.want {
				t.Errorf("ParseChain(%q) = (%q, %v), want (%q, nil)", tc.hex, gotHex, err, tc.want)
			}
			if got != gotHex {
				t.Errorf("slug and hex alias diverged: %q != %q", got, gotHex)
			}
		})
	}
}

func TestParseChain_Unsupported(t *testing.T) {
	for _, raw := range []string{"", "solana", "0xdeadbeef", "ETH ", " eth"} {
		if _, err := ParseChain(raw); !errors.Is(err, ErrUnsupportedChain) {
			t.Errorf("ParseChain(%q) err = %v, want ErrUnsupportedChain", raw, err)
		}
	}
}

func TestPagination_Normalize(t *testing.T) {
	cases := []struct {
		name     string
		in       Pagination
		wantPage int
		wantSize int
	}{
		{"zero value gets defaults", Pagination{}, 0, 25},
		{"negative page clamps to zero", Pagination{Page: -5}, 0, 25},
		{"negative page size falls back to default", Pagination{PageSize: -1}, 0, 25},
		{"oversized page size clamps to max", Pagination{PageSize: 1000}, 0, 100},
		{"in-range values pass through", Pagination{Page: 3, PageSize: 40}, 3, 40},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := tc.in.Normalize(25, 100)
			if got.Page != tc.wantPage || got.PageSize != tc.wantSize {
				t.Errorf("Normalize() = %+v, want Page=%d PageSize=%d", got, tc.wantPage, tc.wantSize)
			}
		})
	}
}
