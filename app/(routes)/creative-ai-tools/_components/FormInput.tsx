"use client"
import Image from 'next/image'
import React, { useState } from 'react'
import { ImagePlus, Loader2Icon, Monitor, Smartphone, Sparkle, Square } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
const sampleProduct = [
    '/headphone.jpeg',
    '/juice-can.jpeg',
    '/perfume.jpeg',
    '/burger.jpeg',
    '/ice-creme.jpeg'
]
type Props = {
    onHandleInputChange: any
    OnGenerate: any
    loading: boolean
}
function FormInput({ onHandleInputChange, OnGenerate, loading }: Props) {
    const [preview, setPreview] = useState<string | null>()
    const onFileSelect = (files: FileList | null) => {
        if (!files || files?.length == 0) return
        const file = files[0]
        if (file.size > 5 * 1024 * 1024) {
            alert('file size greater than 5MB')
            return
        }
        onHandleInputChange('file', file)
        setPreview(URL.createObjectURL(file))
    }
    return (
        <div>
            <div>
                <h2 className='font-semibold'>1.Upload Product Image</h2>
                <div>
                    <label htmlFor='imageUpload' className='mt-2 border-dashed border-2 rounded-xl
                    flex flex-col p-4 items-center justify-center min-h-[200px] cursor-pointer'>
                        {!preview ? <div className='flex flex-col items-center gap-3'>
                            <ImagePlus className='h-8 w-8 opacity-40' />
                            <h2 className='text-xl'>Click here to upload Image</h2>
                            <p className='opacity-45'>Upload image upto 5MB</p>
                        </div>
                            : <Image src={preview} alt='preview' width={300} height={300}
                                className='w-full h-full max-h-[200px] object-contain 
                                rounded-lg
                                '
                            />}
                    </label>
                    <input type='file' id='imageUpload' className='hidden' accept='image/*'
                        onChange={(event) => onFileSelect(event.target.files)}
                    />
                </div>

                <div>
                    <h2 className='opacity-40 text-center mt-3'>Select Sample product to try</h2>
                    <div className='flex gap-5 items-center' >
                        {sampleProduct.map((product, index) => (
                            <Image src={product} alt={product} width={100} height={100} key={index}
                                className='w-[60px] h-[60px] rounded-lg cursor-pointer hover:scale-105 transition-all '
                                onClick={() => {
                                    setPreview(product);
                                    onHandleInputChange('imageUrl', product)
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className='mt-8'>
                    <h2 className='font-semibold'>2.Enter product descriptions</h2>
                    <Textarea placeholder='Tell me more about product and how you want to display'
                        className='min-h-[150px] mt-2 '
                        onChange={(event => onHandleInputChange('description', event.target.value))}
                    />
                </div>
                <div className='mt-8'>
                    <h2 className='font-semibold'>3.Select image Size</h2>
                    <Select onValueChange={(value) => onHandleInputChange('size', value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Resolution" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1024*1024">
                                <div className='flex gap-2 items-center'>
                                    <Square className='h-4 w-4' />
                                    <span>1:1</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="1536*1024">
                                <div className='flex gap-2 items-center'>
                                    <Monitor className='h-4 w-4' />
                                    <span>16:9</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="1024*1536">
                                <div className='flex gap-2 items-center'>
                                    <Smartphone className='h-4 w-4' />
                                    <span>9:16</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                </div>
            </div>
            <Button
                disabled={loading}
                className='mt-10 w-full' onClick={OnGenerate}>{loading ? <Loader2Icon className='animate-spin' /> : <Sparkle />}  Generate</Button>
            <h2 className='mt-1 text-5m opacity-35 text-center'>5 credit to Generate</h2>
        </div>
    )
}

export default FormInput
