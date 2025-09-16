import { readFileSync } from 'fs'
import { join } from 'path'
import { readdir } from 'fs/promises'

interface Collection {
  id: number
  name: string
  description: string
  rarity: string
  imageFile?: string
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
    const csvPath = join(process.cwd(), 'data', 'collections.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    // 读取 collections 目录中的图片文件
    const collectionsDir = join(process.cwd(), 'public', 'collections')
    let imageFiles: string[] = []
    try {
      const files = await readdir(collectionsDir)
      imageFiles = files.filter(file => 
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      )
    } catch (e) {
      console.error('Error reading collections directory:', e)
    }
    
    // 解析 CSV
    const lines = csvContent.split('\n').filter(line => line.trim())
    // const headers = parseCSVLine(lines[0])  // 不再需要headers
    
    const collections: Collection[] = []
    
    // 跳过标题行，解析数据行
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      
      // 确保有足够的字段（至少需要id, name, description）
      if (values.length >= 3) {
        const id = parseInt(values[0])
        
        // 查找对应的图片文件
        const imageFile = imageFiles.find(file => {
          const fileId = parseInt(file.split('.')[0])
          return fileId === id
        })
        
        // 根据ID范围分配稀有度
        let rarity = 'common'
        if (id >= 35 && id <= 42) {
          rarity = 'legendary'
        } else if (id >= 25 && id < 35) {
          rarity = 'epic'
        } else if (id >= 15 && id < 25) {
          rarity = 'rare'
        }
        
        const collection: Collection = {
          id,
          name: values[1],
          description: values[2],
          rarity: rarity,  // 使用计算出的稀有度，而不是CSV的第4列
          imageFile: imageFile ? `/collections/${imageFile}` : undefined
        }
        
        collections.push(collection)
      }
    }
    
    return {
      success: true,
      data: collections
    }
  } catch (error) {
    console.error('Error reading collections.csv:', error)
    return {
      success: false,
      error: 'Failed to load collections',
      data: []
    }
  }
})
