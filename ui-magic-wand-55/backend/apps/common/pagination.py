"""Pagination.

Cursor pagination by default. Submission history and contest standings are the
two hottest list endpoints and both grow without bound; offset pagination
degrades linearly with page depth and, worse, skips or repeats rows when the
underlying set changes between requests -- which for a live submission feed is
every request.
"""

from rest_framework.pagination import CursorPagination, PageNumberPagination


class CursorSetPagination(CursorPagination):
    page_size = 25
    max_page_size = 100
    page_size_query_param = "page_size"
    ordering = "-created_at"


class SmallPageNumberPagination(PageNumberPagination):
    """For bounded sets where a user genuinely needs to jump to page N.

    Problem lists and leaderboards are the intended callers -- both are capped
    in practice and users expect numbered pages there.
    """

    page_size = 25
    max_page_size = 100
    page_size_query_param = "page_size"
