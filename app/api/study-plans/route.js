import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'study_plans.json');

async function readStudyPlans() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data).studyPlans || [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeStudyPlans(studyPlans) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ studyPlans }, null, 2));
}

// GET /api/study-plans - Get all study plans for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    const studyPlans = await readStudyPlans();
    const userPlans = studyPlans.filter(plan => plan.userId === userId);
    return NextResponse.json(userPlans);
  } catch (error) {
    console.error('Error in GET /api/study-plans:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/study-plans - Create a new study plan
export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    const studyPlans = await readStudyPlans();
    const newPlan = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    studyPlans.push(newPlan);
    await writeStudyPlans(studyPlans);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/study-plans:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/study-plans/:id - Update a study plan
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'Study plan ID is required' }, { status: 400 });
    }
    let studyPlans = await readStudyPlans();
    let updatedPlan = null;
    studyPlans = studyPlans.map(plan => {
      if (plan.id === id) {
        updatedPlan = { ...plan, ...data };
        return updatedPlan;
      }
      return plan;
    });
    if (!updatedPlan) {
      return NextResponse.json({ message: 'Study plan not found' }, { status: 404 });
    }
    await writeStudyPlans(studyPlans);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error in PUT /api/study-plans:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/study-plans/:id - Delete a study plan
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Study plan ID is required' }, { status: 400 });
    }
    let studyPlans = await readStudyPlans();
    const initialLength = studyPlans.length;
    studyPlans = studyPlans.filter(plan => plan.id !== id);
    if (studyPlans.length === initialLength) {
      return NextResponse.json({ message: 'Study plan not found' }, { status: 404 });
    }
    await writeStudyPlans(studyPlans);
    return NextResponse.json({ message: 'Study plan deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/study-plans:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
} 