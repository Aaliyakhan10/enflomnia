import json
import boto3
from typing import Optional
from app.config import get_settings

settings = get_settings()


class OpenSearchClient:
    """
    Wrapper for Amazon OpenSearch Serverless vector search.
    Used for RAG-based cross-creator reach pattern comparison.
    """

    def __init__(self):
        self.endpoint = settings.opensearch_endpoint
        self.index = settings.opensearch_index
        self._client = None

    def _get_client(self):
        if not self.endpoint:
            return None
        if not self._client:
            from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
            import boto3

            credentials = boto3.Session().get_credentials()
            auth = AWSV4SignerAuth(credentials, settings.aws_region, "aoss")
            self._client = OpenSearch(
                hosts=[{"host": self.endpoint.replace("https://", ""), "port": 443}],
                http_auth=auth,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection,
                pool_maxsize=20,
            )
        return self._client

    def index_reach_pattern(self, creator_id: str, embedding: list[float], metadata: dict):
        """Index a creator's reach embedding for similarity search."""
        client = self._get_client()
        if not client:
            return  # Dev mode: skip

        doc = {"creator_id": creator_id, "embedding": embedding, **metadata}
        client.index(index=self.index, id=creator_id, body=doc)

    def query_similar_creators(
        self, embedding: list[float], top_k: int = 5, exclude_creator_id: Optional[str] = None
    ) -> list[dict]:
        """
        Find top-k creators with similar reach patterns using kNN search.
        Returns list of creator metadata dicts.
        """
        client = self._get_client()
        if not client:
            return []  # Dev mode: return empty (caller handles fallback)

        query = {
            "size": top_k,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": embedding,
                        "k": top_k,
                    }
                }
            },
        }
        response = client.search(index=self.index, body=query)
        hits = response.get("hits", {}).get("hits", [])
        results = []
        for hit in hits:
            source = hit["_source"]
            if exclude_creator_id and source.get("creator_id") == exclude_creator_id:
                continue
            results.append(source)
        return results
