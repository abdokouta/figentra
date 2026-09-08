# @figentra/search-service

Provider-neutral application boundary with an initial Amazon OpenSearch adapter. Search projections are event-driven; business services never write search indexes directly.

Resource registry determines which index and search strategy applies to each entity. The frontend sends a logical resource type such as `product`, `customer`, `order`, or `project`; it does not know the physical OpenSearch index name.