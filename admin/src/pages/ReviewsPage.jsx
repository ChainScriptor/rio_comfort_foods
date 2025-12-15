import { useState, useMemo } from "react";
import { reviewApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import { StarIcon, PackageIcon, UserIcon, CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: reviewApi.getAll,
  });

  const allReviews = reviewsData?.reviews || [];

  // Filter reviews by search query and rating
  const reviews = useMemo(() => {
    let filtered = allReviews;

    // Filter by search query (product name or user name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.productId?.name?.toLowerCase().includes(query) ||
          review.userId?.name?.toLowerCase().includes(query) ||
          review.userId?.email?.toLowerCase().includes(query)
      );
    }

    // Filter by rating
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((review) => review.rating === rating);
    }

    return filtered;
  }, [allReviews, searchQuery, ratingFilter]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`size-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold">{rating}/5</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Product Reviews</h2>
        <p className="text-base-content/60">View and manage all product reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-base-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold">{allReviews.length}</p>
            </div>
            <div className="bg-primary/20 rounded-full p-3">
              <StarIcon className="size-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 mb-1">Average Rating</p>
              <p className="text-2xl font-bold">
                {allReviews.length > 0
                  ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div className="bg-yellow-500/20 rounded-full p-3">
              <StarIcon className="size-6 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 mb-1">5 Star Reviews</p>
              <p className="text-2xl font-bold">
                {allReviews.filter((r) => r.rating === 5).length}
              </p>
            </div>
            <div className="bg-green-500/20 rounded-full p-3">
              <StarIcon className="size-6 text-green-500 fill-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 mb-1">1 Star Reviews</p>
              <p className="text-2xl font-bold">
                {allReviews.filter((r) => r.rating === 1).length}
              </p>
            </div>
            <div className="bg-red-500/20 rounded-full p-3">
              <StarIcon className="size-6 text-red-500 fill-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by product name or customer..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <select
              className="select select-bordered w-full"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-base-200 rounded-xl p-12 text-center">
          <StarIcon className="size-16 mx-auto mb-4 text-base-content/30" />
          <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
          <p className="text-base-content/60">
            {searchQuery || ratingFilter !== "all"
              ? "Try adjusting your filters"
              : "No reviews have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-base-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {review.productId?.images?.[0] && (
                      <img
                        src={review.productId.images[0]}
                        alt={review.productId.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PackageIcon className="size-4 text-primary" />
                        <h3 className="font-bold text-lg">
                          {review.productId?.name || "Unknown Product"}
                        </h3>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="md:w-64">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="size-4 text-primary" />
                    <div>
                      <p className="font-semibold">
                        {review.userId?.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-base-content/60">
                        {review.userId?.email || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <CalendarIcon className="size-4" />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;

