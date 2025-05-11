import { ref, onBeforeUnmount } from 'vue'

export function useDirtyCheck(vFormRef, emit, intervalMs = 1000) {
    const isDirty = ref(false)
    let initialSnapshot = ''
    let dirtyCheckInterval = null

    const startDirtyCheck = async () => {
        initialSnapshot = JSON.stringify(await vFormRef.value?.getFormData?.() || {})
        stopDirtyCheck()
        dirtyCheckInterval = setInterval(async () => {
            if (!vFormRef.value || !vFormRef.value.getFormData) return
            const current = JSON.stringify(await vFormRef.value.getFormData())
            if (initialSnapshot && current !== initialSnapshot) {
                if (!isDirty.value) {
                    isDirty.value = true
                    emit('updateIsDirty', true)
                }
                stopDirtyCheck()
            }
        }, intervalMs)
    }

    const resetDirty = async () => {
        isDirty.value = false
        initialSnapshot = JSON.stringify(await vFormRef.value?.getFormData?.() || {})
        emit('updateIsDirty', false)
        await startDirtyCheck()
    }

    const stopDirtyCheck = () => {
        if (dirtyCheckInterval) {
            clearInterval(dirtyCheckInterval)
            dirtyCheckInterval = null
        }
    }

    onBeforeUnmount(() => {
        stopDirtyCheck() // 避免组件销毁后再跑 interval
    })

    return {
        isDirty,
        startDirtyCheck,
        resetDirty,
        stopDirtyCheck,
    }
}
