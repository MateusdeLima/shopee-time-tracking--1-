// Banco de dados usando Supabase
import { supabase, setupDatabase } from "../supabase"

// Interfaces para compatibilidade com o código existente
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "employee" | "admin"
  username: string
  createdAt: string
}

export interface Holiday {
  id: number
  name: string
  date: string
  active: boolean
  deadline: string
  maxHours: number
  createdAt: string
  updatedAt?: string
}

export interface OvertimeRecord {
  id: number
  userId: string
  holidayId: number
  holidayName: string
  date: string
  optionId: string
  optionLabel: string
  hours: number
  startTime?: string
  endTime?: string
  createdAt: string
  updatedAt?: string
}

export interface TimeClockRecord {
  id: number
  userId: string
  holidayId: number
  date: string
  startTime: string
  endTime: string | null
  status: "active" | "completed"
  overtimeHours: number
  createdAt: string
  updatedAt?: string
}

export interface AbsenceRecord {
  id: number
  userId: string
  reason: string
  customReason?: string
  dates: string[]
  status: "pending" | "completed" | "approved"
  proofDocument?: string
  createdAt: string
  updatedAt?: string
  expiresAt: string
  dateRange?: {
    start: string
    end: string
  }
}

// Função para converter nomes de campos do Supabase para o formato camelCase usado na aplicação
function convertToCamelCase<T>(data: any): T {
  if (!data) return data

  if (Array.isArray(data)) {
    return data.map((item) => convertToCamelCase(item)) as unknown as T
  }

  if (typeof data === "object" && data !== null) {
    const newObj: any = {}

    Object.keys(data).forEach((key) => {
      // Converter snake_case para camelCase
      const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      newObj[newKey] = convertToCamelCase(data[key])
    })

    return newObj as T
  }

  return data as T
}

// Função para converter nomes de campos do formato camelCase para snake_case usado no Supabase
function convertToSnakeCase(data: any): any {
  if (!data) return data

  if (Array.isArray(data)) {
    return data.map((item) => convertToSnakeCase(item))
  }

  if (typeof data === "object" && data !== null) {
    const newObj: any = {}

    Object.keys(data).forEach((key) => {
      // Converter camelCase para snake_case
      const newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
      newObj[newKey] = convertToSnakeCase(data[key])
    })

    return newObj
  }

  return data
}

// Inicialização do banco de dados
export async function initializeDb() {
  console.log("Inicializando banco de dados...")
  try {
    // Tentar configurar o banco de dados
    const success = await setupDatabase()

    if (!success) {
      console.error("Falha ao inicializar o banco de dados. Tentando novamente...")
      // Tentar novamente após um pequeno atraso
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await setupDatabase()
    }

    return success
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    return false
  }
}

// Funções para usuários
export async function getUsers(): Promise<User[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("users").select("*")

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return []
    }

    return convertToCamelCase<User[]>(data || [])
  } catch (error) {
    console.error("Erro em getUsers:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar usuário por ID:", error)
    return null
  }

  return convertToCamelCase<User>(data)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    if (error && error.code !== "PGRST116") {
      // Ignorar erro de "não encontrado"
      console.error("Erro ao buscar usuário por email:", error)
      return null
    }

    return data ? convertToCamelCase<User>(data) : null
  } catch (error) {
    console.error("Erro em getUserByEmail:", error)
    return null
  }
}

export async function createUser(user: Omit<User, "id" | "createdAt" | "username">): Promise<User> {
  try {
    // Verificar se email já existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Erro ao verificar email existente:", checkError)
      throw new Error("Erro ao verificar email. Tente novamente.")
    }

    if (existingUser) {
      throw new Error("Email já cadastrado")
    }

    // Gerar username único baseado no nome e sobrenome
    const baseUsername = `${user.firstName.toLowerCase().replace(/\s+/g, "")}.${user.lastName.toLowerCase().replace(/\s+/g, "")}`

    // Verificar se o username já existe
    const { data: usernameCheck, error: usernameCheckError } = await supabase
      .from("users")
      .select("username")
      .eq("username", baseUsername)

    if (usernameCheckError) {
      console.error("Erro ao verificar username existente:", usernameCheckError)
      throw new Error("Erro ao verificar username. Tente novamente.")
    }

    let username = baseUsername
    let counter = 1

    // Se o username já existe, adicionar um número
    if (usernameCheck && usernameCheck.length > 0) {
      let usernameExists = true

      while (usernameExists) {
        username = `${baseUsername}${counter}`
        counter++

        const { data: checkAgain, error: checkAgainError } = await supabase
          .from("users")
          .select("username")
          .eq("username", username)
          .maybeSingle()

        if (checkAgainError && checkAgainError.code !== "PGRST116") {
          console.error("Erro ao verificar username alternativo:", checkAgainError)
          throw new Error("Erro ao verificar username. Tente novamente.")
        }

        usernameExists = !!checkAgain
      }
    }

    // Inserir o novo usuário diretamente no Supabase
    const { data, error } = await supabase
      .from("users")
      .insert({
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
        username: username,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar usuário:", error)
      throw new Error("Falha ao criar usuário. Tente novamente.")
    }

    // Converter o resultado para o formato camelCase
    return convertToCamelCase<User>(data)
  } catch (error) {
    console.error("Erro em createUser:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<void> {
  // Excluir usuário (as tabelas relacionadas serão excluídas automaticamente devido às restrições de chave estrangeira)
  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("Erro ao excluir usuário:", error)
    throw new Error("Falha ao excluir usuário")
  }
}

// Funções para feriados
export async function getHolidays(): Promise<Holiday[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("holidays").select("*")

    if (error) {
      console.error("Erro ao buscar feriados:", error)
      return []
    }

    // Ensure data is an array before returning
    return Array.isArray(data) ? convertToCamelCase<Holiday[]>(data) : []
  } catch (error) {
    console.error("Erro em getHolidays:", error)
    return []
  }
}

export async function getHolidayById(id: number): Promise<Holiday | null> {
  const { data, error } = await supabase.from("holidays").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar feriado por ID:", error)
    return null
  }

  return convertToCamelCase<Holiday>(data)
}

export async function getActiveHolidays(): Promise<Holiday[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("holidays").select("*").eq("active", true)

    if (error) {
      console.error("Erro ao buscar feriados ativos:", error)
      return []
    }

    // Ensure data is an array before returning
    return Array.isArray(data) ? convertToCamelCase<Holiday[]>(data) : []
  } catch (error) {
    console.error("Erro em getActiveHolidays:", error)
    return []
  }
}

export async function createHoliday(holiday: Omit<Holiday, "id" | "createdAt">): Promise<Holiday> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    // Converter para snake_case para o Supabase
    const holidayData = convertToSnakeCase({
      name: holiday.name,
      date: holiday.date,
      active: holiday.active,
      deadline: holiday.deadline,
      maxHours: holiday.maxHours,
    })

    const { data, error } = await supabase.from("holidays").insert(holidayData).select().single()

    if (error) {
      console.error("Erro ao criar feriado:", error)
      throw new Error(`Falha ao criar feriado: ${error.message || "Erro desconhecido"}`)
    }

    if (!data) {
      throw new Error("Falha ao criar feriado: Nenhum dado retornado")
    }

    return convertToCamelCase<Holiday>(data)
  } catch (error: any) {
    console.error("Erro em createHoliday:", error)
    throw new Error(error.message || "Falha ao criar feriado")
  }
}

export async function updateHoliday(id: number, data: Partial<Holiday>): Promise<Holiday> {
  // Converter para snake_case para o Supabase
  const holidayData = convertToSnakeCase({
    ...data,
    updatedAt: new Date().toISOString(),
  })

  const { data: updatedData, error } = await supabase
    .from("holidays")
    .update(holidayData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar feriado:", error)
    throw new Error("Falha ao atualizar feriado")
  }

  return convertToCamelCase<Holiday>(updatedData)
}

export async function toggleHolidayStatus(id: number): Promise<Holiday> {
  // Buscar feriado atual
  const holiday = await getHolidayById(id)
  if (!holiday) {
    throw new Error("Feriado não encontrado")
  }

  // Atualizar status
  return await updateHoliday(id, { active: !holiday.active })
}

// Funções para registros de horas extras
export async function getOvertimeRecords(): Promise<OvertimeRecord[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("overtime_records").select("*")

    if (error) {
      console.error("Erro ao buscar registros de horas extras:", error)
      return []
    }

    return convertToCamelCase<OvertimeRecord[]>(data || [])
  } catch (error) {
    console.error("Erro em getOvertimeRecords:", error)
    return []
  }
}

export async function getOvertimeRecordsByUserId(userId: string): Promise<OvertimeRecord[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("overtime_records").select("*").eq("user_id", userId)

    if (error) {
      console.error("Erro ao buscar registros de horas extras por usuário:", error)
      return []
    }

    // Ensure data is an array before returning
    return Array.isArray(data) ? convertToCamelCase<OvertimeRecord[]>(data) : []
  } catch (error) {
    console.error("Erro em getOvertimeRecordsByUserId:", error)
    return []
  }
}

export async function getOvertimeRecordById(id: number): Promise<OvertimeRecord | null> {
  const { data, error } = await supabase.from("overtime_records").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar registro de horas extras por ID:", error)
    return null
  }

  return convertToCamelCase<OvertimeRecord>(data)
}

export async function createOvertimeRecord(record: Omit<OvertimeRecord, "id" | "createdAt">): Promise<OvertimeRecord> {
  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    userId: record.userId,
    holidayId: record.holidayId,
    holidayName: record.holidayName,
    date: record.date,
    optionId: record.optionId,
    optionLabel: record.optionLabel,
    hours: record.hours,
    startTime: record.startTime,
    endTime: record.endTime,
  })

  const { data, error } = await supabase.from("overtime_records").insert(recordData).select().single()

  if (error) {
    console.error("Erro ao criar registro de horas extras:", error)
    throw new Error("Falha ao criar registro de horas extras")
  }

  return convertToCamelCase<OvertimeRecord>(data)
}

export async function updateOvertimeRecord(id: number, data: Partial<OvertimeRecord>): Promise<OvertimeRecord> {
  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    ...data,
    updatedAt: new Date().toISOString(),
  })

  const { data: updatedData, error } = await supabase
    .from("overtime_records")
    .update(recordData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar registro de horas extras:", error)
    throw new Error("Falha ao atualizar registro de horas extras")
  }

  return convertToCamelCase<OvertimeRecord>(updatedData)
}

export async function deleteOvertimeRecord(id: number): Promise<void> {
  const { error } = await supabase.from("overtime_records").delete().eq("id", id)

  if (error) {
    console.error("Erro ao excluir registro de horas extras:", error)
    throw new Error("Falha ao excluir registro de horas extras")
  }
}

// Funções para registros de ponto
export async function getTimeClockRecords(): Promise<TimeClockRecord[]> {
  const { data, error } = await supabase.from("time_clock_records").select("*")

  if (error) {
    console.error("Erro ao buscar registros de ponto:", error)
    return []
  }

  return convertToCamelCase<TimeClockRecord[]>(data || [])
}

export async function getTimeClockRecordsByUserId(userId: string): Promise<TimeClockRecord[]> {
  const { data, error } = await supabase.from("time_clock_records").select("*").eq("user_id", userId)

  if (error) {
    console.error("Erro ao buscar registros de ponto por usuário:", error)
    return []
  }

  return convertToCamelCase<TimeClockRecord[]>(data || [])
}

export async function getTimeClockRecordById(id: number): Promise<TimeClockRecord | null> {
  const { data, error } = await supabase.from("time_clock_records").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar registro de ponto por ID:", error)
    return null
  }

  return convertToCamelCase<TimeClockRecord>(data)
}

export async function getActiveTimeClockByUserId(userId: string, holidayId: number): Promise<TimeClockRecord | null> {
  const { data, error } = await supabase
    .from("time_clock_records")
    .select("*")
    .eq("user_id", userId)
    .eq("holiday_id", holidayId)
    .eq("status", "active")
    .single()

  if (error && error.code !== "PGRST116") {
    // Ignorar erro de "não encontrado"
    console.error("Erro ao buscar registro de ponto ativo:", error)
    return null
  }

  return data ? convertToCamelCase<TimeClockRecord>(data) : null
}

export async function createTimeClockRecord(
  record: Omit<TimeClockRecord, "id" | "createdAt">,
): Promise<TimeClockRecord> {
  // Verificar se já existe um registro ativo para este usuário e feriado
  const existingActiveRecord = await getActiveTimeClockByUserId(record.userId, record.holidayId)

  if (existingActiveRecord) {
    throw new Error("Já existe um registro de ponto ativo para este feriado")
  }

  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    userId: record.userId,
    holidayId: record.holidayId,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    status: record.status,
    overtimeHours: record.overtimeHours,
  })

  const { data, error } = await supabase.from("time_clock_records").insert(recordData).select().single()

  if (error) {
    console.error("Erro ao criar registro de ponto:", error)
    throw new Error("Falha ao criar registro de ponto")
  }

  return convertToCamelCase<TimeClockRecord>(data)
}

export async function updateTimeClockRecord(id: number, data: Partial<TimeClockRecord>): Promise<TimeClockRecord> {
  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    ...data,
    updatedAt: new Date().toISOString(),
  })

  const { data: updatedData, error } = await supabase
    .from("time_clock_records")
    .update(recordData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar registro de ponto:", error)
    throw new Error("Falha ao atualizar registro de ponto")
  }

  return convertToCamelCase<TimeClockRecord>(updatedData)
}

export async function deleteTimeClockRecord(id: number): Promise<void> {
  const { error } = await supabase.from("time_clock_records").delete().eq("id", id)

  if (error) {
    console.error("Erro ao excluir registro de ponto:", error)
    throw new Error("Falha ao excluir registro de ponto")
  }
}

// Funções para ausências
export async function getAbsenceRecords(): Promise<AbsenceRecord[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("absence_records").select("*")

    if (error) {
      console.error("Erro ao buscar registros de ausência:", error)
      return []
    }

    return convertToCamelCase<AbsenceRecord[]>(data || [])
  } catch (error) {
    console.error("Erro em getAbsenceRecords:", error)
    return []
  }
}

export async function getAbsenceRecordsByUserId(userId: string): Promise<AbsenceRecord[]> {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    const { data, error } = await supabase.from("absence_records").select("*").eq("user_id", userId)

    if (error) {
      console.error("Erro ao buscar registros de ausência por usuário:", error)
      return []
    }

    return Array.isArray(data) ? convertToCamelCase<AbsenceRecord[]>(data) : []
  } catch (error) {
    console.error("Erro em getAbsenceRecordsByUserId:", error)
    return []
  }
}

export async function getActiveAbsenceRecordsByUserId(userId: string): Promise<AbsenceRecord[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase.from("absence_records").select("*").eq("user_id", userId).gt("expires_at", now)

  if (error) {
    console.error("Erro ao buscar registros de ausência ativos:", error)
    return []
  }

  return convertToCamelCase<AbsenceRecord[]>(data || [])
}

export async function getAbsenceRecordById(id: number): Promise<AbsenceRecord | null> {
  const { data, error } = await supabase.from("absence_records").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar registro de ausência por ID:", error)
    return null
  }

  return convertToCamelCase<AbsenceRecord>(data)
}

export async function createAbsenceRecord(
  record: Omit<AbsenceRecord, "id" | "createdAt" | "expiresAt">,
): Promise<AbsenceRecord> {
  // Calcular data de expiração (30 dias após a primeira data)
  const firstDate = new Date(record.dates[0])
  const expiresAt = new Date(firstDate)
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    userId: record.userId,
    reason: record.reason,
    customReason: record.customReason,
    dates: record.dates,
    status: record.status,
    proofDocument: record.proofDocument,
    expiresAt: expiresAt.toISOString(),
    dateRange: record.dateRange,
  })

  const { data, error } = await supabase.from("absence_records").insert(recordData).select().single()

  if (error) {
    console.error("Erro ao criar registro de ausência:", error)
    throw new Error("Falha ao criar registro de ausência")
  }

  return convertToCamelCase<AbsenceRecord>(data)
}

export async function updateAbsenceRecord(id: number, data: Partial<AbsenceRecord>): Promise<AbsenceRecord> {
  // Converter para snake_case para o Supabase
  const recordData = convertToSnakeCase({
    ...data,
    updatedAt: new Date().toISOString(),
  })

  const { data: updatedData, error } = await supabase
    .from("absence_records")
    .update(recordData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar registro de ausência:", error)
    throw new Error("Falha ao atualizar registro de ausência")
  }

  return convertToCamelCase<AbsenceRecord>(updatedData)
}

export async function deleteAbsenceRecord(id: number): Promise<void> {
  const { error } = await supabase.from("absence_records").delete().eq("id", id)

  if (error) {
    console.error("Erro ao excluir registro de ausência:", error)
    throw new Error("Falha ao excluir registro de ausência")
  }
}

// Função para calcular horas extras com base no horário de trabalho
export function calculateOvertimeHours(
  date: string,
  startTime: string,
  endTime: string,
  standardStartTime = "09:00",
  standardEndTime = "18:00",
): number {
  // Converter strings para objetos Date
  const startDate = new Date(`${date}T${startTime}:00`)
  const endDate = new Date(`${date}T${endTime}:00`)
  const standardStart = new Date(`${date}T${standardStartTime}:00`)
  const standardEnd = new Date(`${date}T${standardEndTime}:00`)

  // Calcular horas extras antes do horário padrão
  let overtimeBefore = 0
  if (startDate < standardStart) {
    overtimeBefore = (standardStart.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }

  // Calcular horas extras depois do horário padrão
  let overtimeAfter = 0
  if (endDate > standardEnd) {
    overtimeAfter = (endDate.getTime() - standardEnd.getTime()) / (1000 * 60 * 60)
  }

  // Arredondar para o número inteiro mais próximo
  const totalOvertime = Math.round(overtimeBefore + overtimeAfter)

  return totalOvertime
}

// Função para determinar a opção de hora extra com base no horário
export function determineOvertimeOption(
  startTime: string,
  endTime: string,
): { id: string; label: string; value: number } {
  // Horário padrão: 9h às 18h
  const standardStartHour = 9
  const standardEndHour = 18

  // Extrair horas do horário de entrada e saída
  const startHour = Number.parseInt(startTime.split(":")[0], 10)
  const endHour = Number.parseInt(endTime.split(":")[0], 10)

  // Determinar horas extras antes e depois do horário padrão
  const beforeHours = Math.max(0, standardStartHour - startHour)
  const afterHours = Math.max(0, endHour - standardEndHour)

  // Opções disponíveis
  const options = [
    { id: "7h_18h", label: "7h às 18h", value: 2 },
    { id: "9h_20h", label: "9h às 20h", value: 2 },
    { id: "8h_19h", label: "8h às 19h", value: 2 },
    { id: "8h_18h", label: "8h às 18h", value: 1 },
    { id: "9h_19h", label: "9h às 19h", value: 1 },
  ]

  // Tentar encontrar uma correspondência exata
  if (startHour === 7 && endHour === 18) return options[0]
  if (startHour === 9 && endHour === 20) return options[1]
  if (startHour === 8 && endHour === 19) return options[2]
  if (startHour === 8 && endHour === 18) return options[3]
  if (startHour === 9 && endHour === 19) return options[4]

  // Se não houver correspondência exata, calcular o total de horas extras
  const totalOvertime = beforeHours + afterHours

  // Encontrar a opção mais próxima com base no total de horas extras
  if (totalOvertime >= 2) {
    // Priorizar opções com base no horário de entrada
    if (startHour === 7) return options[0]
    if (startHour === 8) return options[2]
    return options[1]
  } else if (totalOvertime >= 1) {
    // Priorizar opções com base no horário de entrada
    if (startHour === 8) return options[3]
    return options[4]
  }

  // Caso não encontre nenhuma correspondência, retornar a opção com menor valor
  return options[3]
}

// Funções para cálculos e estatísticas
export async function getHolidayStats(holidayId: number): Promise<{ used: number; max: number }> {
  const holiday = await getHolidayById(holidayId)
  if (!holiday) {
    return { used: 0, max: 0 }
  }

  const { data, error } = await supabase.from("overtime_records").select("hours").eq("holiday_id", holidayId)

  if (error) {
    console.error("Erro ao buscar estatísticas de feriado:", error)
    return { used: 0, max: holiday.maxHours }
  }

  const hoursUsed = data.reduce((total, record) => total + record.hours, 0)

  return {
    used: hoursUsed,
    max: holiday.maxHours,
  }
}

export async function getUserHolidayStats(userId: string, holidayId: number): Promise<{ used: number; max: number }> {
  const holiday = await getHolidayById(holidayId)
  if (!holiday) {
    return { used: 0, max: 0 }
  }

  const { data, error } = await supabase
    .from("overtime_records")
    .select("hours")
    .eq("user_id", userId)
    .eq("holiday_id", holidayId)

  if (error) {
    console.error("Erro ao buscar estatísticas de usuário para feriado:", error)
    return { used: 0, max: holiday.maxHours }
  }

  const hoursUsed = data.reduce((total, record) => total + record.hours, 0)

  return {
    used: hoursUsed,
    max: holiday.maxHours,
  }
}

export async function getSystemSummary() {
  try {
    // Verificar se o banco de dados está inicializado
    await initializeDb()

    // Buscar dados necessários
    const { data: usersData, error: usersError } = await supabase.from("users").select("id, role")

    if (usersError) {
      console.error("Erro ao buscar usuários para estatísticas:", usersError)
      return {
        totalEmployees: 0,
        totalHolidays: 0,
        totalActiveHolidays: 0,
        totalHoursRegistered: 0,
        totalHoursAvailable: 0,
        completionRate: 0,
        totalAbsences: 0,
        pendingAbsences: 0,
      }
    }

    const { data: holidaysData, error: holidaysError } = await supabase.from("holidays").select("id, max_hours, active")

    if (holidaysError) {
      console.error("Erro ao buscar feriados para estatísticas:", holidaysError)
      return {
        totalEmployees: usersData ? usersData.filter((u) => u.role === "employee").length : 0,
        totalHolidays: 0,
        totalActiveHolidays: 0,
        totalHoursRegistered: 0,
        totalHoursAvailable: 0,
        completionRate: 0,
        totalAbsences: 0,
        pendingAbsences: 0,
      }
    }

    const { data: recordsData, error: recordsError } = await supabase.from("overtime_records").select("hours")

    if (recordsError) {
      console.error("Erro ao buscar registros para estatísticas:", recordsError)
      return {
        totalEmployees: usersData ? usersData.filter((u) => u.role === "employee").length : 0,
        totalHolidays: holidaysData ? holidaysData.length : 0,
        totalActiveHolidays: holidaysData ? holidaysData.filter((h) => h.active).length : 0,
        totalHoursRegistered: 0,
        totalHoursAvailable: 0,
        completionRate: 0,
        totalAbsences: 0,
        pendingAbsences: 0,
      }
    }

    const { data: absencesData, error: absencesError } = await supabase.from("absence_records").select("id, status")

    if (absencesError) {
      console.error("Erro ao buscar ausências para estatísticas:", absencesError)
      return {
        totalEmployees: usersData ? usersData.filter((u) => u.role === "employee").length : 0,
        totalHolidays: holidaysData ? holidaysData.length : 0,
        totalActiveHolidays: holidaysData ? holidaysData.filter((h) => h.active).length : 0,
        totalHoursRegistered: recordsData ? recordsData.reduce((sum, record) => sum + record.hours, 0) : 0,
        totalHoursAvailable: 0,
        completionRate: 0,
        totalAbsences: 0,
        pendingAbsences: 0,
      }
    }

    // Calcular estatísticas
    const employees = usersData ? usersData.filter((u) => u.role === "employee").length : 0
    const holidays = holidaysData ? holidaysData.length : 0
    const activeHolidays = holidaysData ? holidaysData.filter((h) => h.active).length : 0
    const totalHours = recordsData ? recordsData.reduce((sum, record) => sum + record.hours, 0) : 0
    const totalAbsences = absencesData ? absencesData.length : 0

    // Calcular o total de horas possíveis (funcionários x feriados)
    let totalPossibleHours = 0
    const employeeIds = usersData ? usersData.filter((u) => u.role === "employee").map((u) => u.id) : []

    if (employeeIds.length > 0 && holidaysData) {
      employeeIds.forEach((employeeId) => {
        holidaysData.forEach((holiday) => {
          totalPossibleHours += holiday.max_hours
        })
      })
    }

    // Calcular taxa de conclusão
    const completionRate = totalPossibleHours > 0 ? (totalHours / totalPossibleHours) * 100 : 0

    return {
      totalEmployees: employees,
      totalHolidays: holidays,
      totalActiveHolidays: activeHolidays,
      totalHoursRegistered: totalHours,
      totalHoursAvailable: totalPossibleHours,
      completionRate,
      totalAbsences,
      pendingAbsences: absencesData ? absencesData.filter((a) => a.status === "pending").length : 0,
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas do sistema:", error)
    return {
      totalEmployees: 0,
      totalHolidays: 0,
      totalActiveHolidays: 0,
      totalHoursRegistered: 0,
      totalHoursAvailable: 0,
      completionRate: 0,
      totalAbsences: 0,
      pendingAbsences: 0,
    }
  }
}

