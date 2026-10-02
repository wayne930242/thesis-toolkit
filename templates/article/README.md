# article template

Skeleton for a writing project that does not need the NTU dissertation format: a plain Typst
document without cover page, front matter, or Lean proofs. `thesis-toolkit new-project <slug>
"<Title>"` copies it to `<projectsDir>/<slug>/` and fills in the title; compile it with
`thesis-toolkit compile <slug> main`. A project that needs the dissertation format imports
`@local/ntu-thesis` instead.
