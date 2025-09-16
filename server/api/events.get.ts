import { readFileSync } from 'fs'
import { join } from 'path'

interface GameEvent {
  id: number
  name: string
  content: string
  sight: string
  choice1: string
  result1: string
  possibility1: string
  reward1: number
  next1: number
  choice2: string
  result2: string
  possibility2: string
  reward2: number
  next2: number
}

// 简单的 CSV 解析函数（处理逗号在引号内的情况）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 添加最后一个字段
  result.push(current.trim())
  
  return result
}

export default defineEventHandler(async () => {
  try {
    // 读取 CSV 文件
    const csvPath = join(process.cwd(), 'data', 'events.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    // 解析 CSV
    const lines = csvContent.split('\n').filter((line: string) => line.trim())
    const headers = parseCSVLine(lines[0])
    
    const events: GameEvent[] = []
    
    // 跳过标题行，解析数据行
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      
    // 确保有足够的字段
    if (values.length >= 14) {
        const event: GameEvent = {
          id: parseInt(values[0]),
          name: values[1],
          content: values[2],
          sight: values[3],
          choice1: values[4],
          result1: values[5],
          possibility1: values[6],
          reward1: parseInt(values[7]) || 0,
          next1: parseInt(values[8]) || 0,
          choice2: values[9],
          result2: values[10],
          possibility2: values[11],
          reward2: parseInt(values[12]) || 0,
          next2: parseInt(values[13]) || 0
        }
        
        events.push(event)
      }
    }
    
    return {
      success: true,
      data: events
    }
  } catch (error) {
    console.error('Error reading events.csv:', error)
    return {
      success: false,
      error: 'Failed to load events',
      data: []
    }
  }
})
