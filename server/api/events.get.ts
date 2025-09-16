import { readFileSync } from 'fs'
import { join } from 'path'

interface GameEvent {
  id: number
  name: string
  content: string
  choice1: string
  choice2: string
  result1: string
  result2: string
  possibility1: string
  possibility2: string
  sight: 'forest' | 'mountain' | 'river'
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
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = parseCSVLine(lines[0])
    
    const events: GameEvent[] = []
    
    // 跳过标题行，解析数据行
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      
      // 确保有足够的字段
      if (values.length >= 10) {
        const event: GameEvent = {
          id: parseInt(values[0]),
          name: values[1],
          content: values[2],
          choice1: values[3],
          choice2: values[4],
          result1: values[5],
          result2: values[6],
          possibility1: values[7],
          possibility2: values[8],
          sight: values[9].trim() as 'forest' | 'mountain' | 'river'
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
