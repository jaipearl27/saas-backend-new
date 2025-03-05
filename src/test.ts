// @Schema({ timestamps: true })
// export class Assignments extends Document {
//   // ... existing props ...
  
//   @Prop({ type: Date })
//   completedAt?: Date;

//   @Prop({ type: Number })
//   completionTime?: number; // In hours
// }


// // Admin Metrics
// export class AssignmentMetricsService {
//     // Get assignment distribution across employees
//     async getAssignmentDistribution(adminId: string) {
//       return Assignments.aggregate([
//         { $match: { adminId: new Types.ObjectId(adminId) } },
//         { $group: { 
//             _id: "$user",
//             totalAssignments: { $sum: 1 },
//             completed: { $sum: { $cond: [{ $eq: ["$status", AssignmentStatus.COMPLETED] }, 1, 0] } }
//           } 
//         },
//         { $project: {
//             employeeId: "$_id",
//             totalAssignments: 1,
//             completed: 1,
//             completionRate: { $divide: ["$completed", "$totalAssignments"] }
//           }
//         }
//       ]);
//     }
  
//     // Calculate overall completion metrics
//     async getAdminCompletionStats(adminId: string) {
//       return Assignments.aggregate([
//         { $match: { adminId: new Types.ObjectId(adminId) } },
//         { $group: {
//             _id: null,
//             total: { $sum: 1 },
//             completed: { $sum: { $cond: [{ $eq: ["$status", AssignmentStatus.COMPLETED] }, 1, 0] } },
//             reassignments: { $sum: { $cond: [{ $eq: ["$status", AssignmentStatus.REASSIGN_REQUESTED] }, 1, 0] } }
//           }
//         },
//         { $project: {
//             completionRate: { $divide: ["$completed", "$total"] },
//             reassignmentRate: { $divide: ["$reassignments", "$total"] }
//           }
//         }
//       ]);
//     }
//   }
  
//   // Employee Metrics
//   export class EmployeeMetricsService {
//     // Get individual performance stats
//     async getEmployeePerformance(userId: string) {
//       return Assignments.aggregate([
//         { $match: { user: new Types.ObjectId(userId) } },
//         { $group: {
//             _id: null,
//             total: { $sum: 1 },
//             avgCompletionTime: { $avg: "$completionTime" },
//             completed: { $sum: { $cond: [{ $eq: ["$status", AssignmentStatus.COMPLETED] }, 1, 0] } },
//             reassignRequests: { $sum: { $cond: [{ $eq: ["$status", AssignmentStatus.REASSIGN_REQUESTED] }, 1, 0] } }
//           }
//         },
//         { $project: {
//             completionRate: { $divide: ["$completed", "$total"] },
//             reassignRate: { $divide: ["$reassignRequests", "$total"] },
//             avgCompletionTime: 1
//           }
//         }
//       ]);
//     }
  
//     // Get current workload summary
//     async getWorkloadSummary(userId: string) {
//       return Assignments.aggregate([
//         { $match: { 
//             user: new Types.ObjectId(userId),
//             status: { $in: [AssignmentStatus.ACTIVE, AssignmentStatus.REASSIGN_APPROVED] }
//           } 
//         },
//         { $group: {
//             _id: null,
//             activeAssignments: { $sum: 1 },
//             overdue: { $sum: { $cond: [{ $lt: ["$dueDate", new Date()] }, 1, 0] } }
//           }
//         }
//       ]);
//     }
//   }