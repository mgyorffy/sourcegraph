	_ "embed"
var (
	//go:embed testdata/small_diff.txt
	smallDiff string

	//go:embed testdata/large_diff.txt
	largeDiff string
)

	r := diff.NewMultiFileDiffReader(strings.NewReader(smallDiff))
	query := &protocol.DiffMatches{Expr: "(?i)polly"}
	matchTree, err := ToMatchTree(query)
	require.NoError(t, err)
	expectedHighlights := &MatchedCommit{
		Diff: map[int]MatchedFileDiff{
				MatchedHunks: map[int]MatchedHunk{
						MatchedLines: map[int]protocol.Ranges{

func BenchmarkDiffSearchCaseInsensitiveOptimization(b *testing.B) {
	b.Run("small diff", func(b *testing.B) {
		r := diff.NewMultiFileDiffReader(strings.NewReader(smallDiff))
		fileDiffs, err := r.ReadAllFiles()
		require.NoError(b, err)

		b.Run("with optimization", func(b *testing.B) {
			query := &protocol.DiffMatches{Expr: "polly", IgnoreCase: true}
			matchTree, err := ToMatchTree(query)
			require.NoError(b, err)

			for i := 0; i < b.N; i++ {
				matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
				require.True(b, matched)
			}
		})

		b.Run("without optimization", func(b *testing.B) {
			query := &protocol.DiffMatches{Expr: "(?i)polly", IgnoreCase: false}
			matchTree, err := ToMatchTree(query)
			require.NoError(b, err)

			for i := 0; i < b.N; i++ {
				matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
				require.True(b, matched)
			}
		})
	})

	b.Run("large diff", func(b *testing.B) {
		r := diff.NewMultiFileDiffReader(strings.NewReader(largeDiff))
		fileDiffs, err := r.ReadAllFiles()
		require.NoError(b, err)

		b.Run("many matches", func(b *testing.B) {
			b.Run("with optimization", func(b *testing.B) {
				query := &protocol.DiffMatches{Expr: "suggestion", IgnoreCase: true}
				matchTree, err := ToMatchTree(query)
				require.NoError(b, err)

				for i := 0; i < b.N; i++ {
					matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
					require.True(b, matched)
				}
			})

			b.Run("without optimization", func(b *testing.B) {
				query := &protocol.DiffMatches{Expr: "(?i)suggestion", IgnoreCase: false}
				matchTree, err := ToMatchTree(query)
				require.NoError(b, err)

				for i := 0; i < b.N; i++ {
					matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
					require.True(b, matched)
				}
			})
		})

		b.Run("few matches", func(b *testing.B) {
			b.Run("with optimization", func(b *testing.B) {
				query := &protocol.DiffMatches{Expr: "limitoffset", IgnoreCase: true}
				matchTree, err := ToMatchTree(query)
				require.NoError(b, err)

				for i := 0; i < b.N; i++ {
					matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
					require.True(b, matched)
				}
			})

			b.Run("without optimization", func(b *testing.B) {
				query := &protocol.DiffMatches{Expr: "(?i)limitoffset", IgnoreCase: false}
				matchTree, err := ToMatchTree(query)
				require.NoError(b, err)

				for i := 0; i < b.N; i++ {
					matched, _, _ := matchTree.Match(&LazyCommit{diff: fileDiffs})
					require.True(b, matched)
				}
			})
		})
	})
}