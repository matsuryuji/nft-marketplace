import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye } from 'lucide-react'
import { HideIcon } from '@/shared/icons'
import { AuthField } from './auth-field'

export const PasswordField = forwardRef<HTMLInputElement, Omit<ComponentProps<typeof AuthField>, 'type' | 'trailing'>>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <AuthField
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? `Ocultar ${props.label.toLowerCase()}` : `Mostrar ${props.label.toLowerCase()}`}
            aria-pressed={visible}
            className="flex size-8 items-center justify-center rounded-md text-[#b39463] transition-colors hover:text-foreground"
          >
            {visible ? <Eye className="size-[18px]" aria-hidden="true" /> : <HideIcon className="h-[15px] w-[19px]" />}
          </button>
        }
        {...props}
      />
    )
  },
)
