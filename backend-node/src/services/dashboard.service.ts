import { Turtle } from '../models/Turtle';
import { Sighting } from '../models/Sighting';
import { PendingVerification } from '../models/PendingVerification';
import type { IDashboardStats } from '../types';

export class DashboardService {
  static async getStats(): Promise<IDashboardStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTurtles,
      totalSightings,
      pendingVerifications,
      returningTurtles,
      newTurtlesThisMonth,
    ] = await Promise.all([
      Turtle.countDocuments(),
      Sighting.countDocuments(),
      PendingVerification.countDocuments({ status: 'pending' }),
      Turtle.countDocuments({ totalSightings: { $gt: 1 } }),
      Turtle.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    const avgSightingsPerTurtle =
      totalTurtles > 0 ? Math.round((totalSightings / totalTurtles) * 10) / 10 : 0;

    return {
      totalTurtles,
      totalSightings,
      returningTurtles,
      newTurtlesThisMonth,
      avgSightingsPerTurtle,
      pendingVerifications,
    };
  }

  /**
   * Species breakdown for stats screen
   */
  static async getSpeciesBreakdown() {
    return Turtle.aggregate([
      { $group: { _id: '$species', count: { $sum: 1 } } },
      { $project: { species: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
  }

  /**
   * Monthly sighting trend (last 12 months)
   */
  static async getSightingTrend() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return Sighting.aggregate([
      { $match: { sightingDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$sightingDate' },
            month: { $month: '$sightingDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  /**
   * Return rate — percentage of turtles seen more than once
   */
  static async getReturnRate() {
    const [total, returning] = await Promise.all([
      Turtle.countDocuments(),
      Turtle.countDocuments({ totalSightings: { $gt: 1 } }),
    ]);
    return total > 0 ? Math.round((returning / total) * 100) : 0;
  }
}
