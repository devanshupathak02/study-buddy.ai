import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json')

async function readUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data).users || []
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

async function writeUsers(users) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2))
}

export async function POST(request) {
  try {
    const { mode, email, password, name, userType } = await request.json()

    if (mode === 'signup') {
      // Check if user already exists
      const users = await readUsers()
      const existingUser = users.find(u => u.email === email)
      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        )
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        userType,
        createdAt: new Date().toISOString()
      }
      users.push(newUser)
      await writeUsers(users)

      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          userType: newUser.userType
        }
      })
    }

    // Login
    const users = await readUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 