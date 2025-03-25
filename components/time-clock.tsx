"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const OVERTIME_OPTIONS = [
  { id: "7h_18h", label: "7h às 18h", value: 2 },
  { id: "9h_20h", label: "9h às 20h", value: 2 },
  { id: "8h_19h", label: "8h às 19h", value: 2 },
  { id: "8h_18h", label: "8h às 18h", value: 1 },
  { id: "9h_19h", label: "9h às 19h", value: 1 },
]

interface TimeClockProps {
  user: any
  selectedHoliday: any
  onOvertimeCalculated: (
    hours: number,
    startTime: string,
    endTime: string,
    optionId: string,
    optionLabel: string,
  ) => void
}

export function TimeClock({ user, selectedHoliday, onOvertimeCalculated }: TimeClockProps) {
  const [selectedOption, setSelectedOption] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Horário padrão de trabalho
  const standardWorkHours = {
    start: "09:00",
    end: "18:00",
  }

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
    setError("")
  }

  const handleRegisterOvertime = () => {
    if (!selectedHoliday) {
      setError("Selecione um feriado para registrar horas extras")
      return
    }

    if (!selectedOption) {
      setError("Selecione uma opção de horário")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Obter detalhes da opção selecionada
      const option = OVERTIME_OPTIONS.find((opt) => opt.id === selectedOption)
      if (!option) {
        setError("Opção inválida")
        setLoading(false)
        return
      }

      // Extrair horários da opção selecionada
      const [startTime, endTime] = getTimesFromOption(option.id)

      // Notificar o componente pai sobre as horas extras calculadas
      onOvertimeCalculated(option.value, startTime, endTime, option.id, option.label)

      // Limpar seleção
      setSelectedOption("")

      toast({
        title: "Horas extras registradas",
        description: `Foram registradas ${option.value}h extras (${option.label})`,
      })
    } catch (error: any) {
      setError(error.message || "Falha ao registrar horas extras. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função para extrair horários de entrada e saída da opção
  const getTimesFromOption = (optionId: string): [string, string] => {
    switch (optionId) {
      case "7h_18h":
        return ["07:00", "18:00"]
      case "9h_20h":
        return ["09:00", "20:00"]
      case "8h_19h":
        return ["08:00", "19:00"]
      case "8h_18h":
        return ["08:00", "18:00"]
      case "9h_19h":
        return ["09:00", "19:00"]
      default:
        return ["09:00", "18:00"]
    }
  }

  if (!selectedHoliday) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Registro de Horas Extras - {selectedHoliday.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Selecione o horário trabalhado:</h3>
            <RadioGroup value={selectedOption} onValueChange={handleOptionChange}>
              {OVERTIME_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.label} ({option.value}h)
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            <span>
              Horário padrão: {standardWorkHours.start} - {standardWorkHours.end}
            </span>
            <span>Horas extras são calculadas automaticamente</span>
          </div>

          <Button
            onClick={handleRegisterOvertime}
            className="w-full bg-[#EE4D2D] hover:bg-[#D23F20]"
            disabled={loading || !selectedOption}
          >
            {loading ? "Processando..." : "Registrar Horas Extras"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

