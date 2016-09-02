package langp

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"sourcegraph.com/sourcegraph/sourcegraph/pkg/conf/feature"
	"sourcegraph.com/sourcegraph/sourcegraph/pkg/inventory/filelang"
)

// Prefix for environment variables referring to language processor configuration
const envLanguageProcessorPrefix = "SG_LANGUAGE_PROCESSOR_"

// Maps real language name to canonical one, that can be used in environment variable names.
// For example C++ => CPP
var languageNameMap = map[string]string{
	"C++":         "CPP",
	"Objective-C": "OBJECTIVEC",
}

// DefaultClient is the default language processor client.
var DefaultClient *MultiClient

func init() {
	if !feature.Features.Universe {
		return
	}

	newClient := func(v string) *Client {
		client, err := NewClient(v)
		if err != nil {
			log.Fatalf("$%s %v", v, err)
		}
		return client
	}
	clients := make(map[string]*Client)
	for _, env := range os.Environ() {
		parts := strings.SplitN(env, "=", 2)
		lang := lpEnvLanguage(parts[0])
		if lang != "" {
			clients[lang] = newClient(parts[1])
		}
	}
	DefaultClient = &MultiClient{
		Clients: clients,
	}
}

// MultiClient is a client which wraps multiple underlying clients and is
// responsible for invoking the proper client (or combining results) depending
// on the request / which langauge the source file is.
type MultiClient struct {
	// Clients is a map of languages to their respective clients.
	Clients map[string]*Client
}

// Prepare invokes Prepare on each underlying client returning the first error
// that occurs, if any.
func (mc *MultiClient) Prepare(ctx context.Context, r *RepoRev) error {
	for _, cl := range mc.Clients {
		if err := cl.Prepare(ctx, r); err != nil {
			return err
		}
	}
	return nil
}

// find finds the client related to the file extension for filename.
func (mc *MultiClient) find(filename string) (*Client, error) {
	candidates := filelang.Langs.ByFilename(filename)
	for _, candidate := range candidates {
		normalized, ok := languageNameMap[candidate.Name]
		if !ok {
			normalized = candidate.Name
		}
		normalized = strings.ToUpper(normalized)
		client, ok := mc.Clients[normalized]
		if ok {
			return client, nil
		}
	}
	return nil, fmt.Errorf("MultiClient: no client registered for extension %q (did you set SG_LANGUAGE_PROCESSOR_<lang> ?)", filepath.Ext(filename))
}

// DefSpecToPosition invokes DefSpecToPosition on the client whose language matches
// the given key.
func (mc *MultiClient) DefSpecToPosition(ctx context.Context, k *DefSpec) (*Position, error) {
	var lang string
	switch k.UnitType {
	case "GoPackage":
		lang = "Go"
	case "JavaArtifact":
		lang = "Java"
	case "JSModule":
		lang = "JavaScript"
	}
	client, ok := mc.Clients[strings.ToUpper(lang)]
	if ok {
		return client.DefSpecToPosition(ctx, k)
	}
	return nil, fmt.Errorf("MultiClient: no client registered for defkey %q (did you set SG_LANGUAGE_PROCESSOR_<lang> ?)", k.UnitType)
}

// Definition invokes Definition on the client whose language matches p.File.
func (mc *MultiClient) Definition(ctx context.Context, p *Position) (*Range, error) {
	c, err := mc.find(p.File)
	if err != nil {
		return nil, err
	}
	return c.Definition(ctx, p)
}

// Hover invokes Hover on the client whose language matches p.File.
func (mc *MultiClient) Hover(ctx context.Context, p *Position) (*Hover, error) {
	c, err := mc.find(p.File)
	if err != nil {
		return nil, err
	}
	return c.Hover(ctx, p)
}

// LocalRefs invokes LocalRefs on the client whose language matches p.File.
func (mc *MultiClient) LocalRefs(ctx context.Context, p *Position) (*RefLocations, error) {
	c, err := mc.find(p.File)
	if err != nil {
		return nil, err
	}
	return c.LocalRefs(ctx, p)
}

// DefSpecRefs invokes DefSpecRefs on the client whose language matches p.File.
func (mc *MultiClient) DefSpecRefs(ctx context.Context, k *DefSpec) (*RefLocations, error) {
	result := &RefLocations{}
	for _, c := range mc.Clients {
		v, err := c.DefSpecRefs(ctx, k)
		if err != nil {
			return nil, err
		}
		result.Refs = append(result.Refs, v.Refs...)
	}
	return result, nil
}

// ExternalRefs invokes ExternalRefs for each client and combines the results,
// returning the first error that occurs, if any.
func (mc *MultiClient) ExternalRefs(ctx context.Context, r *RepoRev) (*ExternalRefs, error) {
	result := &ExternalRefs{}
	for _, c := range mc.Clients {
		v, err := c.ExternalRefs(ctx, r)
		if err != nil {
			return nil, err
		}
		result.Defs = append(result.Defs, v.Defs...)
	}
	return result, nil
}

// ExportedSymbols invokes ExportedSymbols for each client and combines the
// results, returning the first error that occurs, if any.
func (mc *MultiClient) ExportedSymbols(ctx context.Context, r *RepoRev) (*ExportedSymbols, error) {
	result := &ExportedSymbols{}
	for _, c := range mc.Clients {
		v, err := c.ExportedSymbols(ctx, r)
		if err != nil {
			return nil, err
		}
		result.Symbols = append(result.Symbols, v.Symbols...)
	}
	return result, nil
}

// lpEnvLanguage tries to extract language name from environment variable name
// which is supposed to be in form PREFIX_LANG
func lpEnvLanguage(key string) string {
	if !strings.HasPrefix(key, envLanguageProcessorPrefix) {
		return ""
	}
	return key[len(envLanguageProcessorPrefix):]
}
