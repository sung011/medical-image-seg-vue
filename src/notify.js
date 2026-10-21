import Swal from 'sweetalert2'

export function showMessage(message, icon = 'info') {
  return Swal.fire({
    text: message,
    icon,
    confirmButtonText: '확인',
    confirmButtonColor: '#0d9488'
  })
}
