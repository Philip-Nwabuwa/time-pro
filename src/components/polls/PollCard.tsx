"use client";

import React from "react";
import { BarChart3, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number | null;
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  anonymous: boolean | null;
  active: boolean | null;
  options: PollOption[];
  created_at: string | null;
}

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionId: string) => void;
  onToggleActive?: (pollId: string, active: boolean) => void;
  onDelete?: (pollId: string) => void;
  hasVoted?: boolean;
  userVote?: string;
  isLoading?: boolean;
  canManage?: boolean;
}

export default function PollCard({
  poll,
  onVote,
  onToggleActive,
  onDelete,
  hasVoted = false,
  userVote,
  isLoading = false,
  canManage = false,
}: PollCardProps) {
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + (option.vote_count || 0),
    0
  );

  const handleVote = (optionId: string) => {
    if (onVote) {
      onVote(poll.id, optionId);
    }
  };

  const getPercentage = (votes: number): number => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  return (
    <Card>
      {canManage && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">
                  {poll.title}
                </CardTitle>
                {poll.active && (
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Live
                  </div>
                )}
              </div>
              {poll.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {poll.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {poll.active ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive?.(poll.id, false)}
                  disabled={isLoading}
                >
                  Publish
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive?.(poll.id, true)}
                  disabled={isLoading}
                >
                  Activate
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(poll.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  disabled={isLoading}
                  title="Delete poll"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      {/* <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              {poll.active && (
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Live
                </div>
              )}
              {poll.anonymous && (
                <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  Anonymous
                </div>
              )}
            </div>
            {poll.description && (
              <p className="text-sm text-gray-600">{poll.description}</p>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleActive?.(poll.id, !poll.active)}
                className="h-8 w-8 p-0"
                disabled={isLoading}
                title={poll.active ? "Deactivate poll" : "Activate poll"}
              >
                <div className={`w-2 h-2 rounded-full ${poll.active ? 'bg-green-500' : 'bg-gray-400'}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(poll.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                disabled={isLoading}
                title="Delete poll"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader> */}

      <CardContent className="space-y-4">
        {/* Results with clickable voting */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            {canManage || !(poll.active ?? false) ? (
              <span>
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </span>
            ) : (
              <span>Results hidden until published</span>
            )}
            {hasVoted && userVote && (
              <span className="text-purple-900 font-medium">• You voted</span>
            )}
          </div>

          <div className="space-y-2">
            {poll.options.map((option) => {
              const percentage = getPercentage(option.vote_count || 0);
              const isUserChoice = hasVoted && userVote === option.id;
              const canVote = (poll.active ?? false) && !hasVoted;
              const showResults = canManage || !(poll.active ?? false);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={canVote ? () => handleVote(option.id) : undefined}
                  disabled={!canVote || isLoading}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isUserChoice
                      ? "border-purple-900 bg-purple-50"
                      : canVote
                      ? "border-gray-200 bg-gray-50 hover:border-purple-900 hover:bg-purple-50 cursor-pointer"
                      : "border-gray-200 bg-gray-50 cursor-default"
                  }`}
                  aria-pressed={isUserChoice}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex-1">
                      {option.option_text}
                      {isUserChoice && (
                        <span className="text-purple-900 text-xs ml-2">
                          (Your vote)
                        </span>
                      )}
                    </span>
                    {showResults ? (
                      <span className="text-sm text-gray-600 ml-2">
                        {percentage}% ({option.vote_count || 0})
                      </span>
                    ) : null}
                  </div>
                  {showResults ? (
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorClassName={
                        isUserChoice ? "bg-purple-400" : "bg-gray-900"
                      }
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state for inactive polls with no votes */}
        {!(poll.active ?? false) && totalVotes === 0 && !canManage && (
          <div className="text-center py-4 text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Poll is not active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
