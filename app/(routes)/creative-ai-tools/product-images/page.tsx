"use client"
import FormInput from "../_components/FormInput";
import React, { useState } from "react";
import PreviewResult from "../_components/PreviewResult";
import axios from "axios";
type FormData = {
    file?: File | undefined,
    description: string,
    size: string,
    imageUrl?: string
}
function ProductImages() {

    const [formData, setFormData] = useState<FormData>()
    const [loading, setLoading] = useState(false)
    const onHandleInputChange = (field: string, value: string | File) => {
        setFormData((prev: any) => (
            {
                ...prev,
                [field]: value
            }
        ))
    }
    const OnGenerate = async () => {
        if (!formData?.file && !formData?.imageUrl) {
            alert('please upload Product Image')
            return
        }
        // if (formData?.description || formData?.size) {
        //     alert('enter all fields')
        //     return
        // }
        setLoading(true)
        const formData_ = new FormData()
        if (formData.file) {
            formData_.append('file', formData?.file)
        }

        formData_.append('description', formData?.description ?? '')
        formData_?.append('size', formData?.size ?? '1028*1028')


        const result = await axios.post('/api/generate-product-image', formData_)
        console.log(result.data)
        setLoading(false)
    }
    return (
        <div>
            <h2 className="font-bold text-2xl mb-3">AI Product Image Generator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <FormInput onHandleInputChange={(field: string, value: string) => onHandleInputChange(field, value)}
                        OnGenerate={OnGenerate}
                        loading={loading}
                    />
                </div>
                <div className="md:grid-cols-2">
                    <PreviewResult />
                </div>
            </div>
        </div>
    )
}
export default ProductImages