export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md animate-pulse">
            {/* Image Skeleton - Match ProductCard height */}
            <div className="w-full h-56 sm:h-60 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            </div>

            {/* Content Skeleton - Match ProductCard layout */}
            <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                {/* Title Skeleton */}
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>

                {/* Rating Skeleton */}
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>

                {/* Price Skeleton */}
                <div className="h-6 bg-gray-300 rounded w-1/3 mt-1"></div>

                {/* Button Skeleton */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}
