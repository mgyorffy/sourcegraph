# Table "public.codeintel_schema_migrations"
```
 Column  |  Type   | Collation | Nullable | Default 
---------+---------+-----------+----------+---------
 version | bigint  |           | not null | 
 dirty   | boolean |           | not null | 
Indexes:
    "codeintel_schema_migrations_pkey" PRIMARY KEY, btree (version)

```

# Table "public.lsif_data_definitions"
```
     Column     |  Type   | Collation | Nullable | Default 
----------------+---------+-----------+----------+---------
 dump_id        | integer |           | not null | 
 scheme         | text    |           | not null | 
 identifier     | text    |           | not null | 
 data           | bytea   |           |          | 
 schema_version | integer |           | not null | 
 num_locations  | integer |           | not null | 
Indexes:
    "lsif_data_definitions_pkey" PRIMARY KEY, btree (dump_id, scheme, identifier)
    "lsif_data_definitions_dump_id_schema_version" btree (dump_id, schema_version)
Triggers:
    lsif_data_definitions_schema_versions_insert AFTER INSERT ON lsif_data_definitions REFERENCING NEW TABLE AS newtab FOR EACH STATEMENT EXECUTE FUNCTION update_lsif_data_definitions_schema_versions_insert()

```

Associates (document, range) pairs with the import monikers attached to the range.

**data**: A gob-encoded payload conforming to an array of [LocationData](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L106:6) types.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**identifier**: The moniker identifier.

**num_locations**: The number of locations stored in the data field.

**schema_version**: The schema version of this row - used to determine presence and encoding of data.

**scheme**: The moniker scheme.

# Table "public.lsif_data_definitions_schema_versions"
```
       Column       |  Type   | Collation | Nullable | Default 
--------------------+---------+-----------+----------+---------
 dump_id            | integer |           | not null | 
 min_schema_version | integer |           |          | 
 max_schema_version | integer |           |          | 
Indexes:
    "lsif_data_definitions_schema_versions_pkey" PRIMARY KEY, btree (dump_id)
    "lsif_data_definitions_schema_versions_dump_id_schema_version_bo" btree (dump_id, min_schema_version, max_schema_version)

```

Tracks the range of schema_versions for each upload in the lsif_data_definitions table.

**dump_id**: The identifier of the associated dump in the lsif_uploads table.

**max_schema_version**: An upper-bound on the `lsif_data_definitions.schema_version` where `lsif_data_definitions.dump_id = dump_id`.

**min_schema_version**: A lower-bound on the `lsif_data_definitions.schema_version` where `lsif_data_definitions.dump_id = dump_id`.

# Table "public.lsif_data_documentation_mappings"
```
  Column   |  Type   | Collation | Nullable | Default 
-----------+---------+-----------+----------+---------
 dump_id   | integer |           | not null | 
 path_id   | text    |           | not null | 
 result_id | integer |           | not null | 
 file_path | text    |           |          | 
Indexes:
    "lsif_data_documentation_mappings_pkey" PRIMARY KEY, btree (dump_id, path_id)
    "lsif_data_documentation_mappings_inverse_unique_idx" UNIQUE, btree (dump_id, result_id)

```

Maps documentation path IDs to their corresponding integral documentationResult vertex IDs, which are unique within a dump.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**file_path**: The document file path for the documentationResult, if any. e.g. the path to the file where the symbol described by this documentationResult is located, if it is a symbol.

**path_id**: The documentation page path ID, see see GraphQL codeintel.schema:documentationPage for what this is.

**result_id**: The documentationResult vertex ID.

# Table "public.lsif_data_documentation_pages"
```
     Column     |  Type   | Collation | Nullable | Default 
----------------+---------+-----------+----------+---------
 dump_id        | integer |           | not null | 
 path_id        | text    |           | not null | 
 data           | bytea   |           |          | 
 search_indexed | boolean |           |          | false
Indexes:
    "lsif_data_documentation_pages_pkey" PRIMARY KEY, btree (dump_id, path_id)

```

Associates documentation pathIDs to their documentation page hierarchy chunk.

**data**: A gob-encoded payload conforming to a `type DocumentationPageData struct` pointer (lib/codeintel/semantic/types.go)

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**path_id**: The documentation page path ID, see see GraphQL codeintel.schema:documentationPage for what this is.

# Table "public.lsif_data_documentation_path_info"
```
 Column  |  Type   | Collation | Nullable | Default 
---------+---------+-----------+----------+---------
 dump_id | integer |           | not null | 
 path_id | text    |           | not null | 
 data    | bytea   |           |          | 
Indexes:
    "lsif_data_documentation_path_info_pkey" PRIMARY KEY, btree (dump_id, path_id)

```

Associates documentation page pathIDs to information about what is at that pathID, its immediate children, etc.

**data**: A gob-encoded payload conforming to a `type DocumentationPathInoData struct` pointer (lib/codeintel/semantic/types.go)

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**path_id**: The documentation page path ID, see see GraphQL codeintel.schema:documentationPage for what this is.

# Table "public.lsif_data_documentation_search_private"
```
   Column   |  Type   | Collation | Nullable | Default  
------------+---------+-----------+----------+----------
 dump_id    | integer |           | not null | 
 repo_id    | integer |           | not null | 
 path_id    | text    |           | not null | 
 detail     | text    |           | not null | 
 lang       | text    |           | not null | 
 repo_name  | text    |           | not null | 
 search_key | text    |           | not null | 
 label      | text    |           | not null | 
 tags       | text    |           | not null | 
 dump_root  | text    |           | not null | ''::text
Indexes:
    "lsif_data_documentation_search_private_pkey" PRIMARY KEY, btree (dump_id, path_id)
    "lsif_data_documentation_search_private_label_trgm" gin (label gin_trgm_ops)
    "lsif_data_documentation_search_private_lang_trgm" gin (lang gin_trgm_ops)
    "lsif_data_documentation_search_private_repo_id_idx" btree (repo_id)
    "lsif_data_documentation_search_private_repo_name_trgm" gin (repo_name gin_trgm_ops)
    "lsif_data_documentation_search_private_search_key_trgm" gin (search_key gin_trgm_ops)
    "lsif_data_documentation_search_private_tags_trgm" gin (tags gin_trgm_ops)

```

A trigram index over documentation for search (private repos only)

**detail**: The detail string (e.g. the full function signature and its docs). See protocol/documentation.go:Documentation

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**dump_root**: Identical to lsif_dumps.root; The working directory of the indexer image relative to the repository root.

**label**: The label string of the result, e.g. a one-line function signature. See protocol/documentation.go:Documentation

**lang**: The lowercase language name (go, java, etc.) OR, if unknown, the LSIF indexer name

**path_id**: The fully qualified documentation page path ID, e.g. including "#section". See GraphQL codeintel.schema:documentationPage for what this is.

**repo_id**: The repo ID, from the main app DB repo table. Used to search over a select set of repos by ID.

**repo_name**: The name of the repository containing this search key.

**search_key**: The search key generated by the indexer, e.g. mux.Router.ServeHTTP. It is language-specific, and likely unique within a repository (but not always.) See protocol/documentation.go:Documentation.SearchKey

**tags**: A space separated list of tags from the documentation node. See protocol/documentation.go:Documentation

# Table "public.lsif_data_documentation_search_public"
```
   Column   |  Type   | Collation | Nullable | Default  
------------+---------+-----------+----------+----------
 dump_id    | integer |           | not null | 
 repo_id    | integer |           | not null | 
 path_id    | text    |           | not null | 
 detail     | text    |           | not null | 
 lang       | text    |           | not null | 
 repo_name  | text    |           | not null | 
 search_key | text    |           | not null | 
 label      | text    |           | not null | 
 tags       | text    |           | not null | 
 dump_root  | text    |           | not null | ''::text
Indexes:
    "lsif_data_documentation_search_public_pkey" PRIMARY KEY, btree (dump_id, path_id)
    "lsif_data_documentation_search_private_dump_root_idx" btree (dump_root)
    "lsif_data_documentation_search_public_dump_root_idx" btree (dump_root)
    "lsif_data_documentation_search_public_label_trgm" gin (label gin_trgm_ops)
    "lsif_data_documentation_search_public_lang_trgm" gin (lang gin_trgm_ops)
    "lsif_data_documentation_search_public_repo_id_idx" btree (repo_id)
    "lsif_data_documentation_search_public_repo_name_trgm" gin (repo_name gin_trgm_ops)
    "lsif_data_documentation_search_public_search_key_trgm" gin (search_key gin_trgm_ops)
    "lsif_data_documentation_search_public_tags_trgm" gin (tags gin_trgm_ops)

```

A trigram index over documentation for search (public repos only)

**detail**: The detail string (e.g. the full function signature and its docs). See protocol/documentation.go:Documentation

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**dump_root**: Identical to lsif_dumps.root; The working directory of the indexer image relative to the repository root.

**label**: The label string of the result, e.g. a one-line function signature. See protocol/documentation.go:Documentation

**lang**: The lowercase language name (go, java, etc.) OR, if unknown, the LSIF indexer name

**path_id**: The fully qualified documentation page path ID, e.g. including "#section". See GraphQL codeintel.schema:documentationPage for what this is.

**repo_id**: The repo ID, from the main app DB repo table. Used to search over a select set of repos by ID.

**repo_name**: The name of the repository containing this search key.

**search_key**: The search key generated by the indexer, e.g. mux.Router.ServeHTTP. It is language-specific, and likely unique within a repository (but not always.) See protocol/documentation.go:Documentation.SearchKey

**tags**: A space separated list of tags from the documentation node. See protocol/documentation.go:Documentation

# Table "public.lsif_data_documents"
```
     Column      |  Type   | Collation | Nullable | Default 
-----------------+---------+-----------+----------+---------
 dump_id         | integer |           | not null | 
 path            | text    |           | not null | 
 data            | bytea   |           |          | 
 schema_version  | integer |           | not null | 
 num_diagnostics | integer |           | not null | 
 ranges          | bytea   |           |          | 
 hovers          | bytea   |           |          | 
 monikers        | bytea   |           |          | 
 packages        | bytea   |           |          | 
 diagnostics     | bytea   |           |          | 
Indexes:
    "lsif_data_documents_pkey" PRIMARY KEY, btree (dump_id, path)
    "lsif_data_documents_dump_id_schema_version" btree (dump_id, schema_version)
Triggers:
    lsif_data_documents_schema_versions_insert AFTER INSERT ON lsif_data_documents REFERENCING NEW TABLE AS newtab FOR EACH STATEMENT EXECUTE FUNCTION update_lsif_data_documents_schema_versions_insert()

```

Stores reference, hover text, moniker, and diagnostic data about a particular text document witin a dump.

**data**: A gob-encoded payload conforming to the [DocumentData](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L13:6) type. This field is being migrated across ranges, hovers, monikers, packages, and diagnostics columns and will be removed in a future release of Sourcegraph.

**diagnostics**: A gob-encoded payload conforming to the [Diagnostics](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L18:2) field of the DocumentDatatype.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**hovers**: A gob-encoded payload conforming to the [HoversResults](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L15:2) field of the DocumentDatatype.

**monikers**: A gob-encoded payload conforming to the [Monikers](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L16:2) field of the DocumentDatatype.

**num_diagnostics**: The number of diagnostics stored in the data field.

**packages**: A gob-encoded payload conforming to the [PackageInformation](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L17:2) field of the DocumentDatatype.

**path**: The path of the text document relative to the associated dump root.

**ranges**: A gob-encoded payload conforming to the [Ranges](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L14:2) field of the DocumentDatatype.

**schema_version**: The schema version of this row - used to determine presence and encoding of data.

# Table "public.lsif_data_documents_schema_versions"
```
       Column       |  Type   | Collation | Nullable | Default 
--------------------+---------+-----------+----------+---------
 dump_id            | integer |           | not null | 
 min_schema_version | integer |           |          | 
 max_schema_version | integer |           |          | 
Indexes:
    "lsif_data_documents_schema_versions_pkey" PRIMARY KEY, btree (dump_id)
    "lsif_data_documents_schema_versions_dump_id_schema_version_boun" btree (dump_id, min_schema_version, max_schema_version)

```

Tracks the range of schema_versions for each upload in the lsif_data_documents table.

**dump_id**: The identifier of the associated dump in the lsif_uploads table.

**max_schema_version**: An upper-bound on the `lsif_data_documents.schema_version` where `lsif_data_documents.dump_id = dump_id`.

**min_schema_version**: A lower-bound on the `lsif_data_documents.schema_version` where `lsif_data_documents.dump_id = dump_id`.

# Table "public.lsif_data_metadata"
```
      Column       |  Type   | Collation | Nullable | Default 
-------------------+---------+-----------+----------+---------
 dump_id           | integer |           | not null | 
 num_result_chunks | integer |           |          | 
Indexes:
    "lsif_data_metadata_pkey" PRIMARY KEY, btree (dump_id)

```

Stores the number of result chunks associated with a dump.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**num_result_chunks**: A bound of populated indexes in the lsif_data_result_chunks table for the associated dump. This value is used to hash identifiers into the result chunk index to which they belong.

# Table "public.lsif_data_references"
```
     Column     |  Type   | Collation | Nullable | Default 
----------------+---------+-----------+----------+---------
 dump_id        | integer |           | not null | 
 scheme         | text    |           | not null | 
 identifier     | text    |           | not null | 
 data           | bytea   |           |          | 
 schema_version | integer |           | not null | 
 num_locations  | integer |           | not null | 
Indexes:
    "lsif_data_references_pkey" PRIMARY KEY, btree (dump_id, scheme, identifier)
    "lsif_data_references_dump_id_schema_version" btree (dump_id, schema_version)
Triggers:
    lsif_data_references_schema_versions_insert AFTER INSERT ON lsif_data_references REFERENCING NEW TABLE AS newtab FOR EACH STATEMENT EXECUTE FUNCTION update_lsif_data_references_schema_versions_insert()

```

Associates (document, range) pairs with the export monikers attached to the range.

**data**: A gob-encoded payload conforming to an array of [LocationData](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L106:6) types.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**identifier**: The moniker identifier.

**num_locations**: The number of locations stored in the data field.

**schema_version**: The schema version of this row - used to determine presence and encoding of data.

**scheme**: The moniker scheme.

# Table "public.lsif_data_references_schema_versions"
```
       Column       |  Type   | Collation | Nullable | Default 
--------------------+---------+-----------+----------+---------
 dump_id            | integer |           | not null | 
 min_schema_version | integer |           |          | 
 max_schema_version | integer |           |          | 
Indexes:
    "lsif_data_references_schema_versions_pkey" PRIMARY KEY, btree (dump_id)
    "lsif_data_references_schema_versions_dump_id_schema_version_bou" btree (dump_id, min_schema_version, max_schema_version)

```

Tracks the range of schema_versions for each upload in the lsif_data_references table.

**dump_id**: The identifier of the associated dump in the lsif_uploads table.

**max_schema_version**: An upper-bound on the `lsif_data_references.schema_version` where `lsif_data_references.dump_id = dump_id`.

**min_schema_version**: A lower-bound on the `lsif_data_references.schema_version` where `lsif_data_references.dump_id = dump_id`.

# Table "public.lsif_data_result_chunks"
```
 Column  |  Type   | Collation | Nullable | Default 
---------+---------+-----------+----------+---------
 dump_id | integer |           | not null | 
 idx     | integer |           | not null | 
 data    | bytea   |           |          | 
Indexes:
    "lsif_data_result_chunks_pkey" PRIMARY KEY, btree (dump_id, idx)

```

Associates result set identifiers with the (document path, range identifier) pairs that compose the set.

**data**: A gob-encoded payload conforming to the [ResultChunkData](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.26/-/blob/enterprise/lib/codeintel/semantic/types.go#L76:6) type.

**dump_id**: The identifier of the associated dump in the lsif_uploads table (state=completed).

**idx**: The unique result chunk index within the associated dump. Every result set identifier present should hash to this index (modulo lsif_data_metadata.num_result_chunks).
