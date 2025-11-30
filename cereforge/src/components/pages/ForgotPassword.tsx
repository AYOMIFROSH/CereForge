import { useState } from "react";


const ForgotPassword = () => {
    const [mail, setMail] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMail(mail)
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center mt-10 gap-6">

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 gap-4">
                    <label htmlFor="ForgetPassword">Enter Your Email*</label>
                    <input
                        type="email"
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                        className={`w-90 pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 `}
                        placeholder="Enter your email"
                    />
                    <button>Submit</button>

                </form>

            </div>

        </>
    )
}

export default ForgotPassword;