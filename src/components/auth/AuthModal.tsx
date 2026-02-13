import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-slate-800">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </Dialog.Close>
          </div>

          {mode === 'login' ? (
            <LoginForm onSuccess={() => onOpenChange(false)} />
          ) : (
            <SignupForm onSuccess={() => onOpenChange(false)} />
          )}

          <div className="mt-4 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 hover:text-blue-700 font-medium">
                  Log in
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
