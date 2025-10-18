import { useQuery } from "@tanstack/react-query";
import { Star, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RatingSummary {
  averageRating: string;
  totalRatings: number;
}

interface RatingWithDetails {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  requestReference: string;
  requestDate: string;
}

interface RatingsResponse {
  summary: RatingSummary;
  ratings: RatingWithDetails[];
}

export default function TransporterRatings() {
  const user = JSON.parse(localStorage.getItem("camionback_user") || "{}");

  const { data, isLoading } = useQuery<RatingsResponse>({
    queryKey: ["/api/transporters", user?.id, "ratings"],
    enabled: !!user?.id,
  });

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1" data-testid={`stars-${score}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= score
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-600 text-gray-600"
            }`}
            data-testid={`star-${star <= score ? "filled" : "empty"}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a2540] p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Mes avis clients</h1>
          <p className="text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || { averageRating: "0.0", totalRatings: 0 };
  const ratings = data?.ratings || [];

  return (
    <div className="min-h-screen bg-[#0a2540] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6" data-testid="heading-ratings">
          Mes avis clients
        </h1>

        {/* Summary Card */}
        <Card className="mb-6 bg-white/10 border-white/20" data-testid="card-summary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <div>
                  <div className="text-4xl font-bold text-white" data-testid="text-average-rating">
                    {summary.averageRating}
                  </div>
                  <div className="text-sm text-gray-300">/ 5</div>
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-semibold text-white" data-testid="text-total-ratings">
                  {summary.totalRatings}
                </div>
                <div className="text-sm text-gray-300">
                  {summary.totalRatings === 0
                    ? "évaluation"
                    : summary.totalRatings === 1
                    ? "évaluation"
                    : "évaluations"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Ratings Message */}
        {ratings.length === 0 && (
          <Card className="bg-white/10 border-white/20" data-testid="card-no-ratings">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-300">
                Vous n'avez pas encore reçu d'avis.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Continuez à effectuer vos livraisons pour bâtir votre réputation sur
                CamionBack.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ratings List */}
        {ratings.length > 0 && (
          <div className="space-y-4">
            {ratings.map((rating: any) => (
              <Card
                key={rating.id}
                className="bg-white/10 border-white/20"
                data-testid={`card-rating-${rating.id}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
                    <span data-testid={`text-reference-${rating.id}`}>
                      {rating.requestReference}
                    </span>
                    <span className="text-sm font-normal text-gray-300" data-testid={`text-date-${rating.id}`}>
                      {rating.createdAt
                        ? format(new Date(rating.createdAt), "d MMMM yyyy", {
                            locale: fr,
                          })
                        : "N/A"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderStars(rating.score)}
                  {rating.comment && (
                    <p className="text-gray-300 mt-3 text-sm" data-testid={`text-comment-${rating.id}`}>
                      {rating.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
