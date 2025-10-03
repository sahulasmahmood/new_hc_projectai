const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

    // Get current period counts
    const [
      totalPatients,
      todayAppointments,
      totalPrescriptions,
      totalBills,
      pendingBills,
      inventoryItems,
      emergencyCases,
      activeStaff
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.prescription.count(),
      prisma.bill.count(),
      prisma.bill.count({
        where: { status: 'Pending' }
      }),
      // Get all inventory items to calculate low stock properly
      prisma.inventoryItem.findMany({
        select: {
          currentStock: true,
          minStock: true
        }
      }),
      prisma.emergencyCase.count({
        where: {
          status: { not: 'Discharged' }
        }
      }),
      prisma.staff.count({
        where: { status: 'On Duty' }
      })
    ]);

    // Calculate low stock items count (currentStock <= minStock)
    const lowStockItems = inventoryItems.filter(item =>
      item.currentStock <= item.minStock
    ).length;

    // Get previous period counts for trend calculation
    const [
      lastMonthPatients,
      yesterdayAppointments,
      lastMonthPendingBills
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lte: lastMonthEnd
          }
        }
      }),
      prisma.appointment.count({
        where: {
          date: {
            gte: yesterdayStart,
            lte: yesterdayEnd
          }
        }
      }),
      prisma.bill.count({
        where: {
          status: 'Pending',
          createdAt: {
            gte: lastMonth,
            lte: lastMonthEnd
          }
        }
      })
    ]);

    // Calculate revenue
    const totalRevenue = await prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'Paid' }
    });

    const monthlyRevenue = await prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'Paid',
        createdAt: { gte: startOfMonth }
      }
    });

    const lastMonthRevenue = await prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'Paid',
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd
        }
      }
    });

    // Calculate trends
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const patientTrend = calculateTrend(totalPatients, lastMonthPatients);
    const appointmentTrend = calculateTrend(todayAppointments, yesterdayAppointments);
    const revenueTrend = calculateTrend(
      monthlyRevenue._sum.totalAmount || 0,
      lastMonthRevenue._sum.totalAmount || 0
    );
    const billTrend = calculateTrend(pendingBills, lastMonthPendingBills);

    res.json({
      success: true,
      data: {
        totalPatients,
        todayAppointments,
        totalPrescriptions,
        totalBills,
        pendingBills,
        lowStockItems,
        emergencyCases,
        activeStaff,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        trends: {
          patients: patientTrend,
          appointments: appointmentTrend,
          revenue: revenueTrend,
          bills: billTrend
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get appointment trends (last 7 days)
const getAppointmentTrends = async (req, res) => {
  try {
    const trends = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.appointment.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      trends.push({
        date: startOfDay.toISOString().split('T')[0],
        day: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        appointments: count
      });
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching appointment trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment trends',
      error: error.message
    });
  }
};

// Get patient growth (last 6 months)
const getPatientGrowth = async (req, res) => {
  try {
    const growth = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

      const count = await prisma.patient.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      });

      growth.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        patients: count,
        date: date.toISOString()
      });
    }

    res.json({
      success: true,
      data: growth
    });
  } catch (error) {
    console.error('Error fetching patient growth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient growth',
      error: error.message
    });
  }
};

// Get revenue trends (last 6 months)
const getRevenueTrends = async (req, res) => {
  try {
    const trends = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

      const revenue = await prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'Paid',
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      });

      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: revenue._sum.totalAmount || 0,
        date: date.toISOString()
      });
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends',
      error: error.message
    });
  }
};

// Get top medicines prescribed
const getTopMedicines = async (req, res) => {
  try {
    const medicines = await prisma.prescriptionMedication.groupBy({
      by: ['medicineName'],
      _count: {
        medicineName: true
      },
      orderBy: {
        _count: {
          medicineName: 'desc'
        }
      },
      take: 10
    });

    const formattedMedicines = medicines.map(med => ({
      name: med.medicineName,
      count: med._count.medicineName
    }));

    res.json({
      success: true,
      data: formattedMedicines
    });
  } catch (error) {
    console.error('Error fetching top medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top medicines',
      error: error.message
    });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const [recentAppointments, recentPrescriptions, recentBills] = await Promise.all([
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { name: true, visibleId: true }
          }
        }
      }),
      prisma.prescription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { name: true, visibleId: true }
          }
        }
      }),
      prisma.bill.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { name: true, visibleId: true }
          }
        }
      })
    ]);

    const activities = [
      ...recentAppointments.map(apt => ({
        type: 'appointment',
        message: `New appointment scheduled for ${apt.patient?.name || apt.patientName}`,
        time: apt.createdAt,
        patientId: apt.patient?.visibleId || apt.patientVisibleId
      })),
      ...recentPrescriptions.map(pres => ({
        type: 'prescription',
        message: `Prescription created for ${pres.patient?.name || pres.patientName}`,
        time: pres.createdAt,
        patientId: pres.patient?.visibleId || pres.patientVisibleId
      })),
      ...recentBills.map(bill => ({
        type: 'billing',
        message: `Bill ${bill.billNumber} generated for ${bill.patient?.name}`,
        time: bill.createdAt,
        patientId: bill.patient?.visibleId,
        amount: bill.totalAmount
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    // Get all inventory items and filter where currentStock <= minStock
    const allItems = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
        minStock: true,
        unit: true,
        category: true,
        supplier: true
      },
      orderBy: {
        currentStock: 'asc'
      }
    });

    // Filter items where current stock is at or below minimum stock
    const lowStockItems = allItems.filter(item =>
      item.currentStock <= item.minStock
    ).slice(0, 10); // Take top 10 most critical

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts',
      error: error.message
    });
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: today,
          lte: tomorrow
        },
        status: { not: 'Cancelled' }
      },
      include: {
        patient: {
          select: { name: true, visibleId: true, phone: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      take: 10
    });

    res.json({
      success: true,
      data: upcomingAppointments
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAppointmentTrends,
  getPatientGrowth,
  getRevenueTrends,
  getTopMedicines,
  getRecentActivities,
  getLowStockAlerts,
  getUpcomingAppointments
};