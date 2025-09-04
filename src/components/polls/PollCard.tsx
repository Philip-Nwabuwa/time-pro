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
    0,
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
            <span>
              {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
            </span>
            {hasVoted && userVote && (
              <span className="text-purple-900 font-medium">• You voted</span>
            )}
          </div>

          <div className="space-y-2">
            {poll.options.map((option) => {
              const percentage = getPercentage(option.vote_count || 0);
              const isUserChoice = hasVoted && userVote === option.id;
              const canVote = (poll.active ?? false) && !hasVoted;

              return (
                <div
                  key={option.id}
                  onClick={canVote ? () => handleVote(option.id) : undefined}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isUserChoice
                      ? "border-purple-900 bg-purple-50"
                      : canVote
                        ? "border-gray-200 bg-gray-50 hover:border-purple-900 hover:bg-purple-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
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
                    <span className="text-sm text-gray-600 ml-2">
                      {percentage}% ({option.vote_count || 0})
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className={`h-2 ${isUserChoice ? "bg-purple-200" : ""}`}
                  />
                </div>
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
